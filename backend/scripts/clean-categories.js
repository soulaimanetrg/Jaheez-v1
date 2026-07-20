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
  console.log('🧹 Cleaning existing categories in table service_categories...');
  
  // 1. Delete all categories
  const { error: deleteErr } = await supabase
    .from('service_categories')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything
    
  if (deleteErr) {
    console.error('❌ Failed to clean service_categories:', deleteErr.message);
    process.exit(1);
  }
  
  console.log('✅ Deleted all existing service categories.');
  
  // 2. Insert main root service categories
  console.log('🌱 Inserting 5 root service categories...');
  const rootCategories = [
    { name_ar: 'طعام', name_fr: 'Restauration', type: 'service', icon_emoji: '🍽️', color_hex: '#F03030', sort_order: 1, is_active: true },
    { name_ar: 'بقالة', name_fr: 'Épicerie', type: 'service', icon_emoji: '🛒', color_hex: '#10B981', sort_order: 2, is_active: true },
    { name_ar: 'صيدلية', name_fr: 'Pharmacie', type: 'service', icon_emoji: '💊', color_hex: '#3A8FE8', sort_order: 3, is_active: true },
    { name_ar: 'توصيل طرود', name_fr: 'Colis', type: 'service', icon_emoji: '📦', color_hex: '#F5A623', sort_order: 4, is_active: true },
    { name_ar: 'مهمة خاصة', name_fr: 'Errand', type: 'service', icon_emoji: '🛍️', color_hex: '#9333EA', sort_order: 5, is_active: true },
  ];
  
  const { data: insertedRoots, error: rootErr } = await supabase
    .from('service_categories')
    .insert(rootCategories)
    .select();
    
  if (rootErr) {
    console.error('❌ Failed to insert root categories:', rootErr.message);
    process.exit(1);
  }
  
  console.log('✅ Root categories inserted.');
  
  // Find IDs of root categories to link children
  const foodId = insertedRoots.find(c => c.name_ar === 'طعام')?.id;
  const groceryId = insertedRoots.find(c => c.name_ar === 'بقالة')?.id;
  const pharmacyId = insertedRoots.find(c => c.name_ar === 'صيدلية')?.id;
  
  if (!foodId || !groceryId || !pharmacyId) {
    console.error('❌ Could not find generated IDs for root categories.');
    process.exit(1);
  }
  
  // 3. Insert child subcategories (maximum possible inspired from Glovo Safi Region)
  console.log('🌱 Inserting Safi/Glovo subcategories (categories of categories)...');
  const subCategories = [
    // Under Food (Restauration)
    { name_ar: 'تاكو', name_fr: 'Tacos', type: 'store', parent_id: foodId, icon_emoji: '🌮', color_hex: '#F03030', sort_order: 1, is_active: true },
    { name_ar: 'شاورما', name_fr: 'Shawarma', type: 'store', parent_id: foodId, icon_emoji: '🌯', color_hex: '#F03030', sort_order: 2, is_active: true },
    { name_ar: 'بيتزا', name_fr: 'Pizza', type: 'store', parent_id: foodId, icon_emoji: '🍕', color_hex: '#F03030', sort_order: 3, is_active: true },
    { name_ar: 'برجر', name_fr: 'Burger', type: 'store', parent_id: foodId, icon_emoji: '🍔', color_hex: '#F03030', sort_order: 4, is_active: true },
    { name_ar: 'إيطالي', name_fr: 'Italien', type: 'store', parent_id: foodId, icon_emoji: '🍝', color_hex: '#F03030', sort_order: 5, is_active: true },
    { name_ar: 'آسيوي', name_fr: 'Asiatique', type: 'store', parent_id: foodId, icon_emoji: '🥢', color_hex: '#F03030', sort_order: 6, is_active: true },
    { name_ar: 'سريع', name_fr: 'Fast Food', type: 'store', parent_id: foodId, icon_emoji: '🍟', color_hex: '#F03030', sort_order: 7, is_active: true },
    { name_ar: 'مغربي', name_fr: 'Marocain', type: 'store', parent_id: foodId, icon_emoji: '🍲', color_hex: '#F03030', sort_order: 8, is_active: true },
    { name_ar: 'صحي', name_fr: 'Sain', type: 'store', parent_id: foodId, icon_emoji: '🥗', color_hex: '#F03030', sort_order: 9, is_active: true },
    { name_ar: 'كريب ووافل', name_fr: 'Crêpes & Gaufres', type: 'store', parent_id: foodId, icon_emoji: '🥞', color_hex: '#F03030', sort_order: 10, is_active: true },
    { name_ar: 'حلويات ومثلجات', name_fr: 'Desserts', type: 'store', parent_id: foodId, icon_emoji: '🍦', color_hex: '#F03030', sort_order: 11, is_active: true },
    { name_ar: 'دجاج محمر', name_fr: 'Poulet Rôti', type: 'store', parent_id: foodId, icon_emoji: '🍗', color_hex: '#F03030', sort_order: 12, is_active: true },
    { name_ar: 'سمك ومأكولات بحرية', name_fr: 'Poisson', type: 'store', parent_id: foodId, icon_emoji: '🐟', color_hex: '#F03030', sort_order: 13, is_active: true },
    { name_ar: 'سندويشات', name_fr: 'Sandwiches', type: 'store', parent_id: foodId, icon_emoji: '🥪', color_hex: '#F03030', sort_order: 14, is_active: true },
    { name_ar: 'مقهى وفطور', name_fr: 'Café & Petit Déjeuner', type: 'store', parent_id: foodId, icon_emoji: '☕', color_hex: '#F03030', sort_order: 15, is_active: true },
    { name_ar: 'عصائر', name_fr: 'Jus', type: 'store', parent_id: foodId, icon_emoji: '🥤', color_hex: '#F03030', sort_order: 16, is_active: true },
    
    // Under Grocery (Épicerie)
    { name_ar: 'خضروات وفواكه', name_fr: 'Fruits & Légumes', type: 'store', parent_id: groceryId, icon_emoji: '🥦', color_hex: '#10B981', sort_order: 1, is_active: true },
    { name_ar: 'ألبان وبيض', name_fr: 'Produits Laitiers', type: 'store', parent_id: groceryId, icon_emoji: '🧀', color_hex: '#10B981', sort_order: 2, is_active: true },
    { name_ar: 'مخبزة وخبز', name_fr: 'Boulangerie', type: 'store', parent_id: groceryId, icon_emoji: '🍞', color_hex: '#10B981', sort_order: 3, is_active: true },
    { name_ar: 'مقبلات وحلويات', name_fr: 'Snacks & Confiserie', type: 'store', parent_id: groceryId, icon_emoji: '🍪', color_hex: '#10B981', sort_order: 4, is_active: true },
    { name_ar: 'مشروبات', name_fr: 'Boissons', type: 'store', parent_id: groceryId, icon_emoji: '🥤', color_hex: '#10B981', sort_order: 5, is_active: true },
    { name_ar: 'منظفات', name_fr: 'Nettoyage', type: 'store', parent_id: groceryId, icon_emoji: '🧼', color_hex: '#10B981', sort_order: 6, is_active: true },
    { name_ar: 'معلبات', name_fr: 'Conserves', type: 'store', parent_id: groceryId, icon_emoji: '🥫', color_hex: '#10B981', sort_order: 7, is_active: true },
    { name_ar: 'لحوم ودواجن', name_fr: 'Boucherie', type: 'store', parent_id: groceryId, icon_emoji: '🥩', color_hex: '#10B981', sort_order: 8, is_active: true },
    
    // Under Pharmacy (Pharmacie)
    { name_ar: 'أدوية', name_fr: 'Médicaments', type: 'store', parent_id: pharmacyId, icon_emoji: '💊', color_hex: '#3A8FE8', sort_order: 1, is_active: true },
    { name_ar: 'عناية بالطفل', name_fr: 'Soins Bébé', type: 'store', parent_id: pharmacyId, icon_emoji: '👶', color_hex: '#3A8FE8', sort_order: 2, is_active: true },
    { name_ar: 'عناية بالبشرة / تجميل', name_fr: 'Beauté & Cosmétiques', type: 'store', parent_id: pharmacyId, icon_emoji: '🧴', color_hex: '#3A8FE8', sort_order: 3, is_active: true },
    { name_ar: 'مكملات غذائية وفيتامينات', name_fr: 'Vitamines & Bien-être', type: 'store', parent_id: pharmacyId, icon_emoji: '🥝', color_hex: '#3A8FE8', sort_order: 4, is_active: true },
    { name_ar: 'نظافة وإسعافات أولية', name_fr: 'Hygiène & Soins', type: 'store', parent_id: pharmacyId, icon_emoji: '🩹', color_hex: '#3A8FE8', sort_order: 5, is_active: true },
  ];
  
  const { error: subErr } = await supabase
    .from('service_categories')
    .insert(subCategories);
    
  if (subErr) {
    console.error('❌ Failed to insert subcategories:', subErr.message);
    process.exit(1);
  }
  
  console.log(`✅ Successfully seeded ${subCategories.length} subcategories!`);
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Migration script failed:', error);
  process.exit(1);
});
