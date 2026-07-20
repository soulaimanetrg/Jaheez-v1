'use strict';
require('dotenv').config({ path: '.env.staging.local' });
require('dotenv').config({ path: '../.env' });
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { Transform, Writable } = require('stream');
const { finished, pipeline } = require('stream/promises');
const { once } = require('events');
const { Client } = require('pg');
const { resolveTool } = require('./tool-resolver');

const MAGIC = Buffer.from('JHZB1');
const backupDir = process.env.JAHEEZ_BACKUP_DIR || path.join(require('os').tmpdir(), 'jaheez-encrypted-backups');
const command = process.argv[2];
const KEEP_ENV_KEYS = [
  'PATH',
  'Path',
  'SystemRoot',
  'WINDIR',
  'HOME',
  'USERPROFILE',
  'TMP',
  'TEMP',
  'TMPDIR',
];

function key() {
  const raw = process.env.BACKUP_ENCRYPTION_KEY || '';
  const parsed = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (parsed.length !== 32) throw new Error('BACKUP_ENCRYPTION_KEY must be 32 bytes (hex or base64).');
  return parsed;
}
function tool(name) {
  const resolved = resolveTool(name);
  if (!resolved) throw new Error(`${name} is unavailable; install PostgreSQL client tools first.`);
  return resolved.executable;
}
function assertDistinct() {
  if (!process.env.PRODUCTION_DATABASE_URL) throw new Error('PRODUCTION_DATABASE_URL is required.');
  if (!process.env.STAGING_DATABASE_URL) throw new Error('STAGING_DATABASE_URL is required.');
  if (process.env.PRODUCTION_DATABASE_URL === process.env.STAGING_DATABASE_URL) throw new Error('Production and staging URLs must differ.');
  if (process.env.STAGING_CONFIRM_ISOLATED !== 'true') throw new Error('STAGING_CONFIRM_ISOLATED=true is required.');
  validateDbUrl(process.env.PRODUCTION_DATABASE_URL, 'PRODUCTION_DATABASE_URL');
  validateDbUrl(process.env.STAGING_DATABASE_URL, 'STAGING_DATABASE_URL');
}
function minimalEnv(extra) {
  const env = {};
  for (const key of KEEP_ENV_KEYS) {
    if (process.env[key]) env[key] = process.env[key];
  }
  return { ...env, ...extra };
}
function validateDbUrl(raw, label) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw new Error(`${label} must be a valid PostgreSQL URL.`);
  }
  if (!['postgres:', 'postgresql:'].includes(u.protocol)) throw new Error(`${label} must use postgres:// or postgresql://.`);
  if (!u.hostname || ['localhost', '127.0.0.1', '::1'].includes(u.hostname.toLowerCase())) {
    throw new Error(`${label} must point to an isolated remote database, not localhost.`);
  }
  if (!u.username || !u.password) throw new Error(`${label} must include a username and password.`);
  if (!u.pathname || u.pathname === '/') throw new Error(`${label} must include a database name.`);
  return u;
}
function pgTarget(raw) {
  const u = validateDbUrl(raw, 'database URL');
  return { args: ['--host',u.hostname,'--port',u.port || '5432','--username',decodeURIComponent(u.username),
    '--dbname',u.pathname.replace(/^\//,'')],
    env: minimalEnv({ PGPASSWORD: decodeURIComponent(u.password), PGSSLMODE: 'require' }) };
}
function prune() {
  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(backupDir, 0o700); } catch { /* Best effort on Windows. */ }
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  for (const name of fs.readdirSync(backupDir)) {
    if (!/^jaheez-.+\.dump\.enc(?:\.sha256)?$/.test(name)) continue;
    const file = path.join(backupDir, name);
    const stat = fs.lstatSync(file);
    if (!stat.isFile()) continue;
    if (stat.mtimeMs < cutoff) fs.rmSync(file, { force: true });
  }
}
function fileSha256(file) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(file));
  return hash.digest('hex');
}
function waitForExit(child, label) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${label} failed (${code})`)));
  });
}
function readEncryptedHeader(input) {
  const fd = fs.openSync(input, 'r');
  const header = Buffer.alloc(17);
  const bytesRead = fs.readSync(fd, header, 0, 17, 0);
  fs.closeSync(fd);
  if (bytesRead !== 17 || !header.subarray(0, 5).equals(MAGIC)) throw new Error('Invalid backup format.');
  return header;
}
function assertEncryptedInput(input) {
  if (!input || !fs.existsSync(input)) throw new Error('Encrypted backup path is required.');
  if (!/\.dump\.enc$/i.test(input)) throw new Error('Encrypted backup path must end with .dump.enc.');
  if (fs.lstatSync(input).isSymbolicLink()) throw new Error('Refusing to restore from a symbolic link.');
  const checksumFile = `${input}.sha256`;
  if (fs.existsSync(checksumFile)) {
    const expected = fs.readFileSync(checksumFile, 'utf8').trim().split(/\s+/)[0];
    const actual = fileSha256(input);
    if (expected && expected !== actual) throw new Error('Encrypted backup checksum verification failed.');
  }
  return readEncryptedHeader(input);
}
async function verifyEncryptedBackup(input) {
  const header = assertEncryptedInput(input);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), header.subarray(5));
  await pipeline(
    fs.createReadStream(input, { start: 17 }),
    new HoldTag(decipher),
    new Writable({ write(_chunk, _encoding, callback) { callback(); } }),
  );
}
async function resetStagingPublicSchema() {
  const client = new Client({ connectionString: process.env.STAGING_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query('begin');
    const relations = await client.query(`
      select c.relkind, format('%I.%I', n.nspname, c.relname) as qualified_name
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and pg_get_userbyid(c.relowner)=current_user
        and c.relkind in ('r','p','v','m','f')
      order by case c.relkind when 'v' then 0 when 'm' then 0 else 1 end
    `);
    for (const relation of relations.rows) {
      const keyword = relation.relkind === 'v' ? 'VIEW' : relation.relkind === 'm' ? 'MATERIALIZED VIEW' : 'TABLE';
      await client.query(`DROP ${keyword} IF EXISTS ${relation.qualified_name} CASCADE`);
    }
    const functions = await client.query(`
      select format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)) as signature
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and pg_get_userbyid(p.proowner)=current_user
        and p.proname <> 'handle_new_user'
        and not exists (select 1 from pg_depend d where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e')
    `);
    for (const fn of functions.rows) await client.query(`DROP FUNCTION IF EXISTS ${fn.signature} CASCADE`);
    await client.query('commit');
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}
async function backup() {
  assertDistinct(); prune(); const pgDump=tool('pg_dump');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const output = path.join(backupDir, `jaheez-${stamp}.dump.enc`);
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const out = fs.createWriteStream(output, { flags: 'wx', mode: 0o600 });
  out.write(MAGIC); out.write(iv);
  const target = pgTarget(process.env.PRODUCTION_DATABASE_URL);
  // Staging needs the Jaheez database contract, not Supabase-managed schemas
  // or production customer data. Keep the export schema-only and public-only.
  const dump = spawn(pgDump, ['--format=custom','--schema=public','--schema-only','--no-owner','--no-acl',...target.args],
    { stdio: ['ignore','pipe','inherit'], windowsHide: true, env: target.env });
  const cipherEnded = once(cipher, 'end');
  dump.stdout.pipe(cipher).pipe(out, { end: false });
  try {
    await waitForExit(dump, 'pg_dump');
    await cipherEnded;
    out.end(cipher.getAuthTag());
    await finished(out);
    const checksum = fileSha256(output);
    fs.writeFileSync(`${output}.sha256`, `${checksum}  ${path.basename(output)}\n`, { mode: 0o600 });
    await verifyEncryptedBackup(output);
    console.log(JSON.stringify({ ok: true, encrypted_backup: output, sha256: checksum, retention_days: 30, verified: true }));
  } catch (error) {
    out.destroy();
    fs.rmSync(output, { force: true });
    fs.rmSync(`${output}.sha256`, { force: true });
    throw error;
  }
}
class HoldTag extends Transform {
  constructor(decipher) { super(); this.tail = Buffer.alloc(0); this.decipher = decipher; }
  _transform(chunk, _enc, cb) { const all=Buffer.concat([this.tail,chunk]); if(all.length<=16){this.tail=all;return cb();}
    this.tail=all.subarray(all.length-16); this.push(this.decipher.update(all.subarray(0,all.length-16))); cb(); }
  _flush(cb) { try { if (this.tail.length !== 16) throw new Error('Invalid encrypted backup authentication tag.'); this.decipher.setAuthTag(this.tail); this.push(this.decipher.final()); cb(); } catch(e) { cb(e); } }
}
async function restore() {
  assertDistinct(); const pgRestore=tool('pg_restore');
  const input = process.argv[3];
  await verifyEncryptedBackup(input);
  const header = readEncryptedHeader(input);
  const decipher=crypto.createDecipheriv('aes-256-gcm',key(),header.subarray(5));
  const target=pgTarget(process.env.STAGING_DATABASE_URL);
  await resetStagingPublicSchema();
  const decryptedDump = path.join(backupDir, `restore-${crypto.randomUUID()}.dump`);
  await pipeline(
    fs.createReadStream(input, { start: 17 }),
    new HoldTag(decipher),
    fs.createWriteStream(decryptedDump, { flags: 'wx', mode: 0o600 }),
  );
  // auth.users owns a trigger that depends on public.handle_new_user. Keep
  // that function in place while replacing the rest of the public schema.
  const listed = spawnSync(pgRestore, ['--list', decryptedDump], { encoding: 'utf8', windowsHide: true });
  if (listed.status !== 0) {
    fs.rmSync(decryptedDump, { force: true });
    throw new Error(`pg_restore list failed (${listed.status})`);
  }
  const restoreList = path.join(backupDir, `restore-${crypto.randomUUID()}.list`);
  const filtered = listed.stdout.split(/\r?\n/).filter((line) =>
    !(line.includes('FUNCTION') && line.includes('public') && line.includes('handle_new_user'))
  ).join('\n');
  fs.writeFileSync(restoreList, filtered, { mode: 0o600 });
  const restore=spawn(pgRestore,['--schema=public','--use-list',restoreList,'--no-owner','--no-acl',...target.args,decryptedDump],
    { stdio:['ignore','inherit','inherit'], windowsHide:true, env:target.env });
  const restoreExit = waitForExit(restore, 'pg_restore');
  try {
    await restoreExit;
  } catch (error) {
    restore.kill();
    throw error;
  } finally {
    fs.rmSync(restoreList, { force: true });
    fs.rmSync(decryptedDump, { force: true });
  }
  console.log(JSON.stringify({ ok:true, restored_to:'isolated-staging' }));
}

(command === 'backup' ? backup() : command === 'restore' ? restore() : Promise.reject(new Error('Use backup or restore.')))
  .catch(error => { console.error(error.message); process.exit(1); });
