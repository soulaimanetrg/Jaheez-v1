const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('notifications_log')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching columns:', error.message);
  } else {
    console.log('Sample row columns:', Object.keys(data[0] || {}));
    console.log('Full sample row:', data[0]);
  }
}

run();
