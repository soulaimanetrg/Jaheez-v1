'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function versionSortDesc(a, b) {
  const av = path.basename(a).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const bv = path.basename(b).split('.').map((part) => Number.parseInt(part, 10) || 0);
  for (let i = 0; i < Math.max(av.length, bv.length); i += 1) {
    const diff = (bv[i] || 0) - (av[i] || 0);
    if (diff !== 0) return diff;
  }
  return String(b).localeCompare(String(a));
}

function existingFiles(candidates) {
  return candidates.filter((candidate) => {
    try {
      return Boolean(candidate && fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    } catch {
      return false;
    }
  });
}

function postgresInstallCandidates(name) {
  if (process.platform !== 'win32') return [];

  const roots = [
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'PostgreSQL'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'PostgreSQL'),
  ];
  const matches = [];

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const versionRoot = path.join(root, entry.name);
      matches.push(path.join(versionRoot, 'bin', `${name}.exe`));
      matches.push(path.join(versionRoot, 'pgAdmin 4', 'runtime', `${name}.exe`));
    }
  }

  return existingFiles(matches).sort(versionSortDesc);
}

function envOverrideCandidates(name) {
  const normalized = name.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  return existingFiles([
    process.env[`JAHEEZ_${normalized}_PATH`],
    process.env[`${normalized}_PATH`],
  ]);
}

function resolveTool(name) {
  const candidates = [
    ...envOverrideCandidates(name),
    ...postgresInstallCandidates(name),
    name,
  ];

  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ['--version'], { encoding: 'utf8', windowsHide: true });
    if (!probe.error && probe.status === 0) {
      return {
        executable: candidate,
        version: (probe.stdout || probe.stderr || '').trim().split(/\r?\n/)[0],
      };
    }
  }

  return null;
}

module.exports = { resolveTool };
