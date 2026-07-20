const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('notifications_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching logs:', error.message);
  } else {
    console.log('Last 5 notifications:');
    data.forEach(n => {
      console.log(`[${n.created_at}] ID: ${n.id} | Title: ${n.title} | Target: ${n.target} | Sent By: ${n.sent_by}`);
      console.log(`Body: ${n.body}`);
      console.log('---');
    });
  }
}

run();
