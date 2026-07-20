const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load env variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log('⚡ Adding icon_url column to service_categories table in Supabase...');
  
  // We execute raw SQL to alter the table if column not exists.
  // Since supabase client does not support raw sql directly unless via RPC or functions, 
  // we can use the postgres connection string or we can try using a simple RPC if defined,
  // or we can run an alter table script. Wait, Supabase js client doesn't support raw SQL execution directly.
  // But wait! Is there a postgres connection or can we execute sql by calling a schema query?
  // Let's check how migration scripts run or if there's a postgres client in the backend!
  // Wait, let's check backend/src/db/ or backend/src/db/supabase.ts to see if we have pg!
  // Wait, in jaheez-v1 backend, is pg or typeorm used?
  // Let's search for pg or typeorm or sequelize imports in backend/package.json!
  // Let's do a search.
}

main();
