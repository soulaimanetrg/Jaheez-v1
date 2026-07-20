const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load .env from backend directory
const envPath = path.resolve(__dirname, '../backend/.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function list() {
  const { data, error } = await supabase.rpc('get_tables_list'); // If RPC exists, otherwise let's select from pg_class or simple query
  console.log('RPC result:', { data, error });

  // Let's do a simple query on a known table to see if it works
  const resStores = await supabase.from('stores').select('id').limit(1);
  console.log('Stores query result:', resStores);

  // Let's try to query otp_codes again
  const resOtp = await supabase.from('otp_codes').select('*').limit(1);
  console.log('Otp codes query result:', resOtp);
}

list().catch(console.error);
