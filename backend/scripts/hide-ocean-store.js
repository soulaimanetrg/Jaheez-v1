const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function main() {
  const { data: stores, error: findError } = await supabase
    .from('stores')
    .select('id,name,name_ar,is_featured,is_open')
    .or('name.eq.Ocean Restaurant,name_ar.eq.مطعم المحيط');

  if (findError) {
    throw findError;
  }

  if (!stores || stores.length === 0) {
    console.log('No Ocean Restaurant / مطعم المحيط store rows found.');
    return;
  }

  const ids = stores.map((store) => store.id);
  const { error: updateError } = await supabase
    .from('stores')
    .update({ is_featured: false, is_open: false })
    .in('id', ids);

  if (updateError) {
    throw updateError;
  }

  console.log(`Hidden ${ids.length} Ocean Restaurant / مطعم المحيط store row(s).`);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
