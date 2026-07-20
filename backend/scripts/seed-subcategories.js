const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env.');
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false }
});

async function run() {
  console.log('Fetching parent categories...');
  const { data: parents, error: fetchErr } = await sb
    .from('service_categories')
    .select('id, name_fr')
    .is('parent_id', null);

  if (fetchErr) {
    console.error('Error fetching parent categories:', fetchErr);
    process.exit(1);
  }

  console.log('Found parent categories:', parents);

  const foodParent = parents.find(p => p.name_fr === 'Restauration');
  const groceryParent = parents.find(p => p.name_fr === 'Épicerie');
  const pharmacyParent = parents.find(p => p.name_fr === 'Pharmacie');

  if (!foodParent) {
    console.error('Could not find Restauration parent category.');
  } else {
    const { data: existingFood } = await sb.from('service_categories').select('id').eq('parent_id', foodParent.id);
    if (!existingFood || existingFood.length === 0) {
      console.log('Seeding Food subcategories...');
      const { error } = await sb.from('service_categories').insert([
        { name_ar: 'سريع', name_fr: 'Rapide', type: 'service', parent_id: foodParent.id, icon_emoji: '⚡', color_hex: '#F03030', sort_order: 1 },
        { name_ar: 'مغربي', name_fr: 'Marocain', type: 'service', parent_id: foodParent.id, icon_emoji: '🇲🇦', color_hex: '#10B981', sort_order: 2 },
        { name_ar: 'بيتزا', name_fr: 'Pizza', type: 'service', parent_id: foodParent.id, icon_emoji: '🍕', color_hex: '#3A8FE8', sort_order: 3 },
        { name_ar: 'صحي', name_fr: 'Sain', type: 'service', parent_id: foodParent.id, icon_emoji: '🥗', color_hex: '#F5A623', sort_order: 4 },
        { name_ar: 'برجر', name_fr: 'Burger', type: 'service', parent_id: foodParent.id, icon_emoji: '🍔', color_hex: '#9333EA', sort_order: 5 },
        { name_ar: 'تاكو', name_fr: 'Tacos', type: 'service', parent_id: foodParent.id, icon_emoji: '🌮', color_hex: '#EC4899', sort_order: 6 }
      ]);
      if (error) console.error('Error inserting food subcategories:', error);
      else console.log('Successfully seeded Food subcategories.');
    } else {
      console.log('Food subcategories already present.');
    }
  }

  if (!groceryParent) {
    console.error('Could not find Épicerie parent category.');
  } else {
    const { data: existingGrocery } = await sb.from('service_categories').select('id').eq('parent_id', groceryParent.id);
    if (!existingGrocery || existingGrocery.length === 0) {
      console.log('Seeding Grocery subcategories...');
      const { error } = await sb.from('service_categories').insert([
        { name_ar: 'خضروات وفواكه', name_fr: 'fruits & légumes', type: 'service', parent_id: groceryParent.id, icon_emoji: '🥦', color_hex: '#10B981', sort_order: 1 },
        { name_ar: 'ألبان وبيض', name_fr: 'produits laitiers', type: 'service', parent_id: groceryParent.id, icon_emoji: '🥛', color_hex: '#3A8FE8', sort_order: 2 },
        { name_ar: 'مخبزة وخبز', name_fr: 'boulangerie', type: 'service', parent_id: groceryParent.id, icon_emoji: '🍞', color_hex: '#F5A623', sort_order: 3 },
        { name_ar: 'منظفات', name_fr: 'nettoyage', type: 'service', parent_id: groceryParent.id, icon_emoji: '🧼', color_hex: '#9333EA', sort_order: 4 }
      ]);
      if (error) console.error('Error inserting grocery subcategories:', error);
      else console.log('Successfully seeded Grocery subcategories.');
    } else {
      console.log('Grocery subcategories already present.');
    }
  }

  if (!pharmacyParent) {
    console.error('Could not find Pharmacie parent category.');
  } else {
    const { data: existingPharmacy } = await sb.from('service_categories').select('id').eq('parent_id', pharmacyParent.id);
    if (!existingPharmacy || existingPharmacy.length === 0) {
      console.log('Seeding Pharmacy subcategories...');
      const { error } = await sb.from('service_categories').insert([
        { name_ar: 'أدوية', name_fr: 'médicaments', type: 'service', parent_id: pharmacyParent.id, icon_emoji: '💊', color_hex: '#3A8FE8', sort_order: 1 },
        { name_ar: 'عناية بالطفل', name_fr: 'soins bébé', type: 'service', parent_id: pharmacyParent.id, icon_emoji: '🍼', color_hex: '#EC4899', sort_order: 2 },
        { name_ar: 'عناية بالبشرة / تجميل', name_fr: 'beauté & cosmétiques', type: 'service', parent_id: pharmacyParent.id, icon_emoji: '💅', color_hex: '#9333EA', sort_order: 3 }
      ]);
      if (error) console.error('Error inserting pharmacy subcategories:', error);
      else console.log('Successfully seeded Pharmacy subcategories.');
    } else {
      console.log('Pharmacy subcategories already present.');
    }
  }
}

run().catch(console.error);
