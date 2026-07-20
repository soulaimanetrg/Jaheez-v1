const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('service_categories').select('*').limit(1);
  if (error) {
    console.error('❌ Error fetching categories:', error.message);
  } else {
    console.log('✅ Columns in service_categories:', data && data.length > 0 ? Object.keys(data[0]) : 'Table is empty');
  }
  process.exit(0);
}

test();
