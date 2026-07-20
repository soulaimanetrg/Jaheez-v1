const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load .env from backend directory
const envPath = path.resolve(__dirname, '../backend/.env');
console.log('Loading env from:', envPath);
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('--- Testing Upsert Phone OTP ---');
  const resPhone = await supabase
    .from('otp_codes')
    .upsert({ phone: '+212612345678', code: '123456', expires_at: new Date(Date.now() + 5*60*1000).toISOString(), attempts: 0 }, { onConflict: 'phone' });
  console.log('Phone result:', resPhone);

  console.log('--- Testing Upsert Email OTP ---');
  const resEmail = await supabase
    .from('otp_codes')
    .upsert({ phone: 'test@example.com', code: '123456', expires_at: new Date(Date.now() + 5*60*1000).toISOString(), attempts: 0 }, { onConflict: 'phone' });
  console.log('Email result:', resEmail);
}

test().catch(console.error);
