require('dotenv').config({ path: '../.env' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Migrating some existing products and categories to bilingual format...");

  // 1. Fetch categories
  const { data: categories, error: catError } = await supabase
    .from('menu_categories')
    .select('id, name');

  if (catError) {
    console.error("Error fetching categories:", catError);
    return;
  }

  console.log(`Found ${categories.length} categories.`);
  for (const cat of categories) {
    if (!cat.name.includes('|')) {
      const combined = `${cat.name} | ${cat.name} (EN)`;
      console.log(`Updating category ${cat.name} -> ${combined}`);
      await supabase
        .from('menu_categories')
        .update({ name: combined })
        .eq('id', cat.id);
    }
  }

  // 2. Fetch menu items
  const { data: items, error: itemError } = await supabase
    .from('menu_items')
    .select('id, name, description');

  if (itemError) {
    console.error("Error fetching menu items:", itemError);
    return;
  }

  console.log(`Found ${items.length} menu items.`);
  for (const item of items) {
    if (!item.name.includes('|')) {
      const combinedName = `${item.name} | ${item.name} (EN)`;
      const combinedDesc = item.description 
        ? `${item.description} | ${item.description} (EN)`
        : 'Spécialité maison | House specialty';

      console.log(`Updating product name ${item.name} -> ${combinedName}`);
      await supabase
        .from('menu_items')
        .update({ name: combinedName, description: combinedDesc })
        .eq('id', item.id);
    }
  }

  // 3. Fetch stores
  const { data: stores, error: storeError } = await supabase
    .from('stores')
    .select('id, name, description');

  if (storeError) {
    console.error("Error fetching stores:", storeError);
    return;
  }

  console.log(`Found ${stores.length} stores.`);
  for (const s of stores) {
    if (!s.name.includes('|')) {
      const combinedName = `${s.name} | ${s.name} (EN)`;
      const combinedDesc = s.description 
        ? `${s.description} | ${s.description} (EN)`
        : 'Meilleur commerce local | Best local store';

      console.log(`Updating store name ${s.name} -> ${combinedName}`);
      await supabase
        .from('stores')
        .update({ name: combinedName, description: combinedDesc })
        .eq('id', s.id);
    }
  }

  console.log("Migration completed successfully!");
}

run().catch(console.error);
