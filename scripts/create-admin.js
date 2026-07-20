/**
 * JAHEEZ — Create Admin User
 * Run: node scripts/create-admin.js <email> <password> <full_name>
 */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
});

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node scripts/create-admin.js <email> <password> [full_name]');
    process.exit(1);
  }

  const email = args[0].toLowerCase().trim();
  const password = args[1];
  const fullName = args[2] || 'Admin JaheeZ';
  const role = 'super_admin';

  try {
    const hash = await bcrypt.hash(password, 10);
    
    // Ensure table exists (though admin-api.js should have done it)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('super_admin','operations','finance','support','content_manager')),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await pool.query(
      'INSERT INTO admins (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET password_hash = $2',
      [email, hash, fullName, role]
    );

    console.log(`\x1b[32m[ ✓ ] Admin created successfully!\x1b[0m`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}`);
  } catch (err) {
    console.error(`\x1b[31m[ ✗ ] Failed to create admin:\x1b[0m`, err.message);
  } finally {
    await pool.end();
  }
}

main();
