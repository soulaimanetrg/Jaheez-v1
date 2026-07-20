/**
 * JAHEEZ — Seed Safi stores into Supabase
 * Run: node scripts/seed-stores.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const RAW_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
if (!RAW_URL || RAW_URL.includes('/rest/v1') || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running seed-stores.js.');
}
const SUPABASE_URL = RAW_URL.replace(/\/$/, '');
const sb = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const log = (msg) => console.log(`\x1b[36m[seed]\x1b[0m ${msg}`);
const ok  = (msg) => console.log(`\x1b[32m[  ✓ ]\x1b[0m ${msg}`);
const err = (msg) => console.error(`\x1b[31m[ ✗✗ ]\x1b[0m ${msg}`);

/* ── helper: insert and return row ──────────────────────────────────────── */
async function insert(table, row) {
  const { data, error } = await sb.from(table).insert(row).select().single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

/* ── option group helpers ────────────────────────────────────────────────── */
const sizeGroup = (sm = 0, md = 5, lg = 10) => ({
  id: 'size', label: 'الحجم', required: true,
  choices: [
    { id: 'sm', name: 'صغير', extra: sm },
    { id: 'md', name: 'وسط',  extra: md },
    { id: 'lg', name: 'كبير', extra: lg },
  ],
});

const drinkSize = () => ({
  id: 'size', label: 'الحجم', required: true,
  choices: [
    { id: '25cl', name: '25 سل', extra: 0 },
    { id: '50cl', name: '50 سل', extra: 3 },
    { id: '1L',   name: '1 لتر', extra: 6 },
  ],
});

const sauceGroup = (...choices) => ({
  id: 'sauce', label: 'الصلصة', required: false,
  choices: choices.map((n, i) => ({ id: `sc${i}`, name: n, extra: 0 })),
});

const extrasGroup = (items) => ({
  id: 'extras', label: 'إضافات', required: false,
  choices: items.map(([name, price], i) => ({ id: `ex${i}`, name, extra: price })),
});

const cookGroup = () => ({
  id: 'cook', label: 'درجة النضج', required: false,
  choices: [
    { id: 'rare',   name: 'نصف ناضج', extra: 0 },
    { id: 'medium', name: 'متوسط',    extra: 0 },
    { id: 'well',   name: 'ناضج جيداً', extra: 0 },
  ],
});

const toppingsGroup = () => ({
  id: 'tops', label: 'إضافات البيتزا', required: false,
  choices: [
    { id: 't1', name: 'جبن إضافي',    extra: 5  },
    { id: 't2', name: 'مشروم',         extra: 4  },
    { id: 't3', name: 'زيتون',         extra: 3  },
    { id: 't4', name: 'فلفل حار',      extra: 2  },
    { id: 't5', name: 'دجاج إضافي',   extra: 8  },
  ],
});

const eggGroup = () => ({
  id: 'egg', label: 'طريقة البيض', required: false,
  choices: [
    { id: 'fried',   name: 'مقلي',      extra: 0 },
    { id: 'boiled',  name: 'مسلوق',     extra: 0 },
    { id: 'omelette', name: 'أومليت',   extra: 0 },
  ],
});

/* ════════════════════════════════════════════════════════════════════════
   STORE DATA
════════════════════════════════════════════════════════════════════════ */
const STORES = [
  /* ─── 1. Seafood ─── */
  {
    store: {
      name: 'Restaurant La Mer Bleue', name_ar: 'مطعم البحر الأزرق',
      category: 'food', city: 'آسفي', phone: '0524000001',
      address: 'شارع الميناء، آسفي', address_ar: 'شارع الميناء، آسفي',
      delivery_fee: 12, delivery_time: 25, min_order: 40,
      is_open: true, is_featured: true, is_verified: true,
      rating_avg: 4.6, rating_count: 112,
    },
    categories: ['أسماك مشوية', 'مأكولات بحرية', 'سلطات', 'مشروبات'],
    items: [
      { name: 'Sardines Grillées', name_ar: 'سردين مشوي', cat: 'أسماك مشوية', price: 35,
        desc_ar: 'سردين طازج من ميناء آسفي، مشوي على الفحم مع زيت الزيتون والأعشاب',
        options: [sizeGroup(0, 10, 20), sauceGroup('صلصة حارة', 'ليمون', 'شيرموله'), extrasGroup([['خبز', 2], ['سلطة', 5]])],
        is_popular: true, is_featured: true },
      { name: 'Calamars Frits', name_ar: 'كاليمار مقلي', cat: 'مأكولات بحرية', price: 55,
        desc_ar: 'حبار طري مقلي بعجين خفيف مع صلصة الطرطر',
        options: [sizeGroup(0, 10, 20), sauceGroup('طرطر', 'حارة', 'ثوم')],
        is_popular: true },
      { name: 'Crevettes Grillées', name_ar: 'جمبري مشوي', cat: 'مأكولات بحرية', price: 75,
        desc_ar: 'جمبري كبير الحجم مشوي بالثوم والليمون',
        options: [sizeGroup(0, 15, 30), extrasGroup([['خبز', 2], ['أرز', 8]])], is_featured: true },
      { name: 'Salade Marocaine', name_ar: 'سلطة مغربية', cat: 'سلطات', price: 20,
        desc_ar: 'طماطم، خيار، بصل، فلفل بالنعناع الطازج',
        options: [extrasGroup([['زيتون', 3], ['جبن', 5]])] },
      { name: 'Soupe de Poisson', name_ar: 'شوربة السمك', cat: 'أسماك مشوية', price: 25,
        desc_ar: 'شوربة سمك بالخضروات والتوابل المغربية' },
      { name: 'Jus d\'Orange', name_ar: 'عصير برتقال', cat: 'مشروبات', price: 12, options: [drinkSize()] },
      { name: 'Eau Minérale', name_ar: 'ماء معدني', cat: 'مشروبات', price: 5,
        options: [{ id: 'size', label: 'الحجم', required: true, choices: [{ id: '50', name: '50 سل', extra: 0 }, { id: '1L', name: '1 لتر', extra: 4 }] }] },
    ],
  },

  /* ─── 2. Traditional Moroccan ─── */
  {
    store: {
      name: 'Restaurant Al Atlas', name_ar: 'مطعم الأطلس',
      category: 'food', city: 'آسفي', phone: '0524000002',
      address: 'حي المدينة القديمة، آسفي', address_ar: 'حي المدينة القديمة، آسفي',
      delivery_fee: 10, delivery_time: 40, min_order: 50,
      is_open: true, is_featured: true, is_verified: true,
      rating_avg: 4.8, rating_count: 234,
    },
    categories: ['كسكس', 'طاجين', 'شوربات', 'حلويات', 'مشروبات'],
    items: [
      { name: 'Couscous Royal', name_ar: 'كسكس ملكي', cat: 'كسكس', price: 65,
        desc_ar: 'كسكس مغربي أصيل مع دجاج ولحم غنم وخضروات موسمية',
        options: [
          { id: 'protein', label: 'البروتين', required: true,
            choices: [{ id: 'chicken', name: 'دجاج', extra: 0 }, { id: 'lamb', name: 'خروف', extra: 15 }, { id: 'mix', name: 'مشكل', extra: 20 }] },
          extrasGroup([['لبن مخيض', 3], ['حريسة', 2]]),
        ], is_popular: true, is_featured: true },
      { name: 'Tajine Poulet Citron', name_ar: 'طاجين دجاج بالليمون', cat: 'طاجين', price: 55,
        desc_ar: 'طاجين دجاج بالليمون المعصفر والزيتون — وصفة تقليدية',
        options: [extrasGroup([['خبز بلدي', 3], ['أرز', 5]])], is_popular: true },
      { name: 'Tajine Kefta', name_ar: 'طاجين الكفتة', cat: 'طاجين', price: 50,
        desc_ar: 'كفتة لحم بقري مع بيض وصلصة الطماطم الطازجة',
        options: [extrasGroup([['بيض إضافي', 4], ['جبن', 5]])] },
      { name: 'Harira', name_ar: 'حريرة', cat: 'شوربات', price: 18,
        desc_ar: 'الشوربة المغربية الأصيلة بالعدس والحمص والكزبرة',
        options: [sizeGroup(0, 5, 8)] },
      { name: 'Pastilla Poulet', name_ar: 'بسطيلة الدجاج', cat: 'حلويات', price: 45,
        desc_ar: 'بسطيلة تقليدية بالدجاج والمكسرات والقرفة', is_featured: true },
      { name: 'Chebakia', name_ar: 'شبَّاكية', cat: 'حلويات', price: 20,
        desc_ar: 'حلوى مغربية مقلية بالعسل والسمسم' },
      { name: 'Thé à la Menthe', name_ar: 'أتاي بالنعناع', cat: 'مشروبات', price: 10,
        desc_ar: 'شاي مغربي أخضر بالنعناع الطازج',
        options: [{ id: 'sugar', label: 'السكر', required: false, choices: [{ id: 'no', name: 'بدون', extra: 0 }, { id: 'less', name: 'قليل', extra: 0 }, { id: 'normal', name: 'عادي', extra: 0 }] }],
        is_popular: true },
      { name: 'Café au Lait', name_ar: 'قهوة بالحليب', cat: 'مشروبات', price: 12 },
    ],
  },

  /* ─── 3. Pizza & Fast Food ─── */
  {
    store: {
      name: 'Safi Pizza', name_ar: 'بيتزا سافي',
      category: 'food', city: 'آسفي', phone: '0524000003',
      address: 'شارع محمد الخامس، آسفي', address_ar: 'شارع محمد الخامس، آسفي',
      delivery_fee: 8, delivery_time: 20, min_order: 30,
      is_open: true, is_featured: false, is_verified: true,
      rating_avg: 4.3, rating_count: 87,
    },
    categories: ['بيتزا', 'برجر', 'ساندويشات', 'مشروبات', 'ديسيرت'],
    items: [
      { name: 'Pizza Margherita', name_ar: 'بيتزا مرغريتا', cat: 'بيتزا', price: 45,
        desc_ar: 'عجين طازج، صلصة طماطم، موزاريلا',
        options: [
          { id: 'diam', label: 'القطر', required: true,
            choices: [{ id: '26', name: '26 سم', extra: 0 }, { id: '32', name: '32 سم', extra: 15 }, { id: '40', name: '40 سم', extra: 30 }] },
          toppingsGroup(),
          { id: 'crust', label: 'حواف العجين', required: false,
            choices: [{ id: 'thin', name: 'رفيع', extra: 0 }, { id: 'thick', name: 'سميك', extra: 0 }, { id: 'cheese_crust', name: 'حواف بالجبن', extra: 8 }] },
        ], is_popular: true, is_featured: true },
      { name: 'Pizza Mixte', name_ar: 'بيتزا مشكلة', cat: 'بيتزا', price: 55,
        desc_ar: 'دجاج، ذرة، فلفل، زيتون، جبن',
        options: [
          { id: 'diam', label: 'القطر', required: true,
            choices: [{ id: '26', name: '26 سم', extra: 0 }, { id: '32', name: '32 سم', extra: 15 }, { id: '40', name: '40 سم', extra: 30 }] },
          toppingsGroup(),
        ], is_popular: true },
      { name: 'Pizza Viande Hachée', name_ar: 'بيتزا اللحم المفروم', cat: 'بيتزا', price: 60,
        desc_ar: 'لحم مفروم متبل، بصل، فلفل، طماطم',
        options: [
          { id: 'diam', label: 'القطر', required: true,
            choices: [{ id: '26', name: '26 سم', extra: 0 }, { id: '32', name: '32 سم', extra: 15 }] },
          toppingsGroup(),
        ] },
      { name: 'Burger Classique', name_ar: 'برجر كلاسيك', cat: 'برجر', price: 35,
        desc_ar: 'لحم بقري، خس، طماطم، بصل، صلصة خاصة',
        options: [
          cookGroup(),
          extrasGroup([['جبن', 4], ['بيض', 4], ['بيكون دجاج', 6], ['أفوكادو', 8]]),
          sauceGroup('كاتشب', 'مايونيز', 'باربيكيو', 'حارة'),
          { id: 'side', label: 'المرافق', required: false,
            choices: [{ id: 'fries', name: 'بطاطس مقلية', extra: 0 }, { id: 'salad', name: 'سلطة', extra: 0 }, { id: 'coleslaw', name: 'كولسلو', extra: 0 }] },
        ], is_popular: true },
      { name: 'Burger Double', name_ar: 'برجر دبل', cat: 'برجر', price: 55,
        desc_ar: 'لحمتان مع جبن مزدوج وصلصة سرية',
        options: [
          cookGroup(),
          extrasGroup([['جبن', 4], ['بيض', 4], ['مشروم', 5]]),
          sauceGroup('كاتشب', 'مايونيز', 'باربيكيو', 'حارة'),
        ], is_featured: true },
      { name: 'Sandwich Poulet', name_ar: 'ساندويش دجاج', cat: 'ساندويشات', price: 25,
        desc_ar: 'دجاج مشوي، خضروات، صلصة',
        options: [sauceGroup('مايونيز', 'حارة', 'خضراء'), extrasGroup([['جبن', 3], ['بيض', 3]])] },
      { name: 'Coca-Cola 33cl', name_ar: 'كوكا كولا', cat: 'مشروبات', price: 10 },
      { name: 'Jus Orange Frais', name_ar: 'عصير برتقال طازج', cat: 'مشروبات', price: 15, options: [drinkSize()] },
      { name: 'Glace 2 Boules', name_ar: 'آيس كريم كورتين', cat: 'ديسيرت', price: 18,
        desc_ar: 'اختر نكهتين من الفانيليا أو الشوكولاتة أو الفراولة',
        options: [
          { id: 'flavor1', label: 'النكهة الأولى', required: true,
            choices: [{ id: 'van', name: 'فانيليا', extra: 0 }, { id: 'choc', name: 'شوكولاتة', extra: 0 }, { id: 'straw', name: 'فراولة', extra: 0 }] },
          { id: 'flavor2', label: 'النكهة الثانية', required: false,
            choices: [{ id: 'van', name: 'فانيليا', extra: 0 }, { id: 'choc', name: 'شوكولاتة', extra: 0 }, { id: 'straw', name: 'فراولة', extra: 0 }] },
        ] },
    ],
  },

  /* ─── 4. Grills & Shawarma ─── */
  {
    store: {
      name: 'Grill Al Medina', name_ar: 'مشاوي المدينة',
      category: 'food', city: 'آسفي', phone: '0524000004',
      address: 'ساحة المحطة، آسفي', address_ar: 'ساحة المحطة، آسفي',
      delivery_fee: 8, delivery_time: 20, min_order: 25,
      is_open: true, is_featured: false, is_verified: true,
      rating_avg: 4.4, rating_count: 156,
    },
    categories: ['مشويات', 'ساندويشات', 'سلطات', 'مشروبات'],
    items: [
      { name: 'Brochettes Agneau', name_ar: 'برشيطات خروف', cat: 'مشويات', price: 40,
        desc_ar: 'أسياخ خروف مشوية على الفحم مع التوابل البلدية',
        options: [sizeGroup(0, 15, 25), extrasGroup([['خبز', 3], ['سلطة', 5], ['فريت', 10]])],
        is_popular: true, is_featured: true },
      { name: 'Poulet Rôti', name_ar: 'دجاج مشوي', cat: 'مشويات', price: 55,
        desc_ar: 'دجاج بلدي مشوي بالأعشاب والثوم',
        options: [
          { id: 'cut', label: 'التقطيع', required: true,
            choices: [{ id: 'half', name: 'نصف دجاجة', extra: 0 }, { id: 'full', name: 'دجاجة كاملة', extra: 55 }] },
          extrasGroup([['خبز', 3], ['فريت', 10], ['سلطة', 5]]),
        ], is_popular: true },
      { name: 'Kefta Grillée', name_ar: 'كفتة مشوية', cat: 'مشويات', price: 35,
        desc_ar: 'كفتة لحم بقري مع البقدونس والكمون',
        options: [extrasGroup([['خبز', 3], ['طماطم', 4], ['حريسة', 2]])] },
      { name: 'Shawarma Poulet', name_ar: 'شاورما دجاج', cat: 'ساندويشات', price: 28,
        desc_ar: 'شاورما دجاج بالتوم والخضروات والسلطة الحارة',
        options: [
          sauceGroup('توم', 'حارة', 'كاتشب'),
          extrasGroup([['جبن', 3], ['بطاطس', 5]]),
        ], is_popular: true },
      { name: 'Shawarma Viande', name_ar: 'شاورما لحم', cat: 'ساندويشات', price: 32,
        desc_ar: 'شاورما لحم بالتوابل والطحينة',
        options: [sauceGroup('طحينة', 'حارة', 'كاتشب'), extrasGroup([['جبن', 3]])] },
      { name: 'Salade Verte', name_ar: 'سلطة خضراء', cat: 'سلطات', price: 15,
        options: [extrasGroup([['زيت زيتون', 2], ['خل', 1], ['ليمون', 1]])] },
      { name: 'Coca-Cola', name_ar: 'كوكا كولا', cat: 'مشروبات', price: 10 },
      { name: 'Eau', name_ar: 'ماء', cat: 'مشروبات', price: 4 },
    ],
  },

  /* ─── 5. Breakfast Café ─── */
  {
    store: {
      name: 'Café Ftor Safi', name_ar: 'فطور آسفي',
      category: 'food', city: 'آسفي', phone: '0524000005',
      address: 'شارع الحسن الثاني، آسفي', address_ar: 'شارع الحسن الثاني، آسفي',
      delivery_fee: 7, delivery_time: 15, min_order: 20,
      is_open: true, is_featured: false, is_verified: true,
      rating_avg: 4.5, rating_count: 201,
    },
    categories: ['إفطار كامل', 'بيض', 'معجنات', 'مشروبات ساخنة', 'مشروبات باردة'],
    items: [
      { name: 'Ftor Complet', name_ar: 'فطور كامل', cat: 'إفطار كامل', price: 35,
        desc_ar: 'خبز، زبدة، عسل، جبن، بيض، شاي أو قهوة',
        options: [
          eggGroup(),
          { id: 'drink', label: 'المشروب', required: true,
            choices: [{ id: 'tea', name: 'أتاي', extra: 0 }, { id: 'coffee', name: 'قهوة', extra: 0 }, { id: 'milk', name: 'حليب', extra: 0 }] },
          extrasGroup([['زبدة إضافية', 3], ['عسل إضافي', 5], ['خبز بلدي', 2]]),
        ], is_popular: true, is_featured: true },
      { name: 'Baghrir', name_ar: 'بغرير', cat: 'معجنات', price: 18,
        desc_ar: 'فطائر البغرير الإسفنجية بالعسل والزبدة',
        options: [sizeGroup(0, 5, 10), extrasGroup([['عسل إضافي', 5], ['زبدة إضافية', 3]])] },
      { name: 'Msemen', name_ar: 'مسمن', cat: 'معجنات', price: 15,
        desc_ar: 'مسمن طازج بالزبدة والعسل',
        options: [extrasGroup([['عسل', 5], ['جبن', 4], ['كروكان', 6]])], is_popular: true },
      { name: 'Harcha', name_ar: 'حرشة', cat: 'معجنات', price: 12,
        desc_ar: 'حرشة بالسميد وزيت الزيتون' },
      { name: 'Beghrir Kefta', name_ar: 'بغرير بالكفتة', cat: 'بيض', price: 28,
        desc_ar: 'بغرير محشو بالكفتة والطماطم والبيض' },
      { name: 'Oeufs Kefta', name_ar: 'بيض بالكفتة', cat: 'بيض', price: 30,
        desc_ar: 'بيض مطبوخ مع الكفتة وصلصة الطماطم',
        options: [eggGroup(), extrasGroup([['خبز', 3], ['جبن', 4]])] },
      { name: 'Thé à la Menthe', name_ar: 'أتاي بالنعناع', cat: 'مشروبات ساخنة', price: 8,
        options: [{ id: 'sugar', label: 'السكر', required: false, choices: [{ id: 'no', name: 'بدون', extra: 0 }, { id: 'less', name: 'قليل', extra: 0 }, { id: 'normal', name: 'عادي', extra: 0 }] }],
        is_popular: true },
      { name: 'Café Cassé', name_ar: 'قهوة بالحليب', cat: 'مشروبات ساخنة', price: 10,
        options: [{ id: 'milk', label: 'الحليب', required: false, choices: [{ id: 'full', name: 'كامل الدسم', extra: 0 }, { id: 'skim', name: 'خالي الدسم', extra: 0 }] }],
        is_popular: true },
      { name: 'Lait Chaud', name_ar: 'حليب ساخن', cat: 'مشروبات ساخنة', price: 8 },
      { name: 'Jus d\'Orange', name_ar: 'عصير برتقال', cat: 'مشروبات باردة', price: 12, options: [drinkSize()] },
      { name: 'Jus Avocat', name_ar: 'عصير أفوكادو', cat: 'مشروبات باردة', price: 18,
        desc_ar: 'عصير أفوكادو طازج بالحليب والعسل',
        options: [drinkSize()], is_popular: true },
    ],
  },

  /* ─── 6. Supermarket ─── */
  {
    store: {
      name: 'Supermarché Al Farah', name_ar: 'سوبيرمارشي الفرح',
      category: 'grocery', city: 'آسفي', phone: '0524000006',
      address: 'شارع زيتون، آسفي', address_ar: 'شارع زيتون، آسفي',
      delivery_fee: 10, delivery_time: 30, min_order: 50,
      is_open: true, is_featured: true, is_verified: true,
      rating_avg: 4.2, rating_count: 78,
    },
    categories: ['خضروات وفواكه', 'ألبان ومشتقات', 'مواد أساسية', 'مشروبات', 'وجبات خفيفة', 'منظفات'],
    items: [
      { name: 'Tomates 1kg', name_ar: 'طماطم 1كغ', cat: 'خضروات وفواكه', price: 8 },
      { name: 'Pommes de Terre 1kg', name_ar: 'بطاطس 1كغ', cat: 'خضروات وفواكه', price: 7 },
      { name: 'Bananes 1kg', name_ar: 'موز 1كغ', cat: 'خضروات وفواكه', price: 12 },
      { name: 'Oranges 1kg', name_ar: 'برتقال 1كغ', cat: 'خضروات وفواكه', price: 6, is_popular: true },
      { name: 'Lait Centrale 1L', name_ar: 'حليب سنترال 1لتر', cat: 'ألبان ومشتقات', price: 8, is_popular: true },
      { name: 'Yaourt Jaouda', name_ar: 'يوغورت جودة', cat: 'ألبان ومشتقات', price: 5 },
      { name: 'Beurre Présidente 250g', name_ar: 'زبدة بريزيدانت 250غ', cat: 'ألبان ومشتقات', price: 28 },
      { name: 'Fromage Vache Qui Rit', name_ar: 'جبنة الباقرة الضاحكة', cat: 'ألبان ومشتقات', price: 22 },
      { name: 'Riz Tilda 1kg', name_ar: 'أرز تيلدا 1كغ', cat: 'مواد أساسية', price: 18 },
      { name: 'Huile de Table 1L', name_ar: 'زيت المائدة 1لتر', cat: 'مواد أساسية', price: 20, is_popular: true },
      { name: 'Sucre 1kg', name_ar: 'سكر 1كغ', cat: 'مواد أساسية', price: 7 },
      { name: 'Farine 1kg', name_ar: 'دقيق 1كغ', cat: 'مواد أساسية', price: 8 },
      { name: 'Thé Lipton 100s', name_ar: 'أتاي ليبتون 100 كيس', cat: 'مواد أساسية', price: 38 },
      { name: 'Coca-Cola 2L', name_ar: 'كوكا كولا 2لتر', cat: 'مشروبات', price: 20 },
      { name: 'Sidi Ali 1.5L', name_ar: 'سيدي علي 1.5لتر', cat: 'مشروبات', price: 8, is_popular: true },
      { name: 'Jus Pom\'s 1L', name_ar: 'عصير بومز 1لتر', cat: 'مشروبات', price: 18 },
      { name: 'Chips Lay\'s', name_ar: 'شيبس ليز', cat: 'وجبات خفيفة', price: 10, is_popular: true },
      { name: 'Chocolat Milka', name_ar: 'شوكولاتة ميلكا', cat: 'وجبات خفيفة', price: 22 },
      { name: 'Biscuit Oreo', name_ar: 'بسكويت أوريو', cat: 'وجبات خفيفة', price: 18 },
      { name: 'Détergent Ariel 1kg', name_ar: 'مسحوق أريال 1كغ', cat: 'منظفات', price: 45 },
      { name: 'Liquide Vaisselle Fairy', name_ar: 'جلاية فيري', cat: 'منظفات', price: 25 },
    ],
  },

  /* ─── 7. Pharmacy ─── */
  {
    store: {
      name: 'Pharmacie Al Chifaa', name_ar: 'صيدلية الشفاء',
      category: 'pharmacy', city: 'آسفي', phone: '0524000007',
      address: 'شارع الاستقلال، آسفي', address_ar: 'شارع الاستقلال، آسفي',
      delivery_fee: 5, delivery_time: 20, min_order: 0,
      is_open: true, is_featured: false, is_verified: true,
      rating_avg: 4.7, rating_count: 43,
    },
    categories: ['أدوية أساسية', 'مكملات غذائية', 'مستحضرات تجميل', 'صحة الطفل', 'رعاية شخصية'],
    items: [
      { name: 'Paracétamol 500mg x16', name_ar: 'سيتامول 500 ملغ', cat: 'أدوية أساسية', price: 12, desc_ar: 'مسكن للألم وخافض للحرارة', is_popular: true },
      { name: 'Ibuprofène 400mg x20', name_ar: 'إيبوبروفين 400ملغ', cat: 'أدوية أساسية', price: 28 },
      { name: 'Doliprane 1000mg x8', name_ar: 'دوليبران 1000ملغ', cat: 'أدوية أساسية', price: 22 },
      { name: 'Sirop Toux Adulte', name_ar: 'شراب السعال للكبار', cat: 'أدوية أساسية', price: 35 },
      { name: 'Vitamine C 1000mg x20', name_ar: 'فيتامين C 1000 ملغ', cat: 'مكملات غذائية', price: 65, is_popular: true },
      { name: 'Vitamine D3 x30', name_ar: 'فيتامين D3', cat: 'مكملات غذائية', price: 85 },
      { name: 'Magnésium x45', name_ar: 'مغنيزيوم', cat: 'مكملات غذائية', price: 75 },
      { name: 'Oméga-3 x60', name_ar: 'أوميغا 3', cat: 'مكملات غذائية', price: 120 },
      { name: 'Crème Solaire SPF50', name_ar: 'كريم الحماية من الشمس 50', cat: 'مستحضرات تجميل', price: 95, is_popular: true },
      { name: 'Crème Hydratante', name_ar: 'كريم مرطب للوجه', cat: 'مستحضرات تجميل', price: 65 },
      { name: 'Shampooing Anti-Pelliculaire', name_ar: 'شامبو ضد القشرة', cat: 'رعاية شخصية', price: 55 },
      { name: 'Couches Pampers T3 x28', name_ar: 'حفاضات بامبرز مقاس 3', cat: 'صحة الطفل', price: 155, is_popular: true },
      { name: 'Lait Bébé NAN 1 400g', name_ar: 'حليب أطفال NAN 1', cat: 'صحة الطفل', price: 185 },
      { name: 'Thermomètre Digital', name_ar: 'ميزان الحرارة الرقمي', cat: 'رعاية شخصية', price: 45 },
    ],
  },

  /* ─── 8. Épicerie de quartier ─── */
  {
    store: {
      name: 'Épicerie Al Baraka', name_ar: 'حانوت البركة',
      category: 'grocery', city: 'آسفي', phone: '0524000008',
      address: 'حي الوفاء، آسفي', address_ar: 'حي الوفاء، آسفي',
      delivery_fee: 6, delivery_time: 15, min_order: 20,
      is_open: true, is_featured: false, is_verified: false,
      rating_avg: 4.0, rating_count: 29,
    },
    categories: ['معلبات', 'مشروبات', 'وجبات خفيفة', 'مواد أساسية', 'سجائر وكبريت'],
    items: [
      { name: 'Thon en boîte Royal', name_ar: 'تونة معلبة رويال', cat: 'معلبات', price: 18, is_popular: true },
      { name: 'Sardines Dacia', name_ar: 'سردين داسيا', cat: 'معلبات', price: 12, is_popular: true },
      { name: 'Concentré Tomates', name_ar: 'طماطم معلبة', cat: 'معلبات', price: 8 },
      { name: 'Haricots Blancs 400g', name_ar: 'لوبيا بيضاء 400غ', cat: 'معلبات', price: 10 },
      { name: 'Coca-Cola 33cl', name_ar: 'كوكا كولا 33سل', cat: 'مشروبات', price: 8 },
      { name: 'Pepsi 33cl', name_ar: 'بيبسي 33سل', cat: 'مشروبات', price: 8 },
      { name: 'Sidi Ali 60cl', name_ar: 'سيدي علي 60سل', cat: 'مشروبات', price: 5, is_popular: true },
      { name: 'Jus Pom\'s 25cl', name_ar: 'عصير بومز 25سل', cat: 'مشروبات', price: 8 },
      { name: 'Chips Lay\'s Saveur Barbecue', name_ar: 'شيبس باربيكيو', cat: 'وجبات خفيفة', price: 8, is_popular: true },
      { name: 'Biscuit Prince', name_ar: 'بسكويت برنس', cat: 'وجبات خفيفة', price: 6 },
      { name: 'Chocolat Poulain', name_ar: 'شوكولاتة بولان', cat: 'وجبات خفيفة', price: 15 },
      { name: 'Café Nescafé Stick', name_ar: 'نسكافيه ستيك', cat: 'مواد أساسية', price: 3, is_popular: true },
      { name: 'Sucre 500g', name_ar: 'سكر 500غ', cat: 'مواد أساسية', price: 5 },
      { name: 'Allumettes', name_ar: 'كبريت', cat: 'سجائر وكبريت', price: 1.5 },
    ],
  },
];

/* ════════════════════════════════════════════════════════════════════════
   MAIN SEED FUNCTION
════════════════════════════════════════════════════════════════════════ */
async function seed() {
  log('Connecting to Supabase…');

  // Check existing stores
  const { data: existing } = await sb.from('stores').select('name_ar').order('created_at');
  if (existing?.length) {
    log(`Found ${existing.length} existing stores:`);
    existing.forEach(s => log(`  • ${s.name_ar}`));
    const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(res => readline.question('\nWipe and reseed? (y/N): ', ans => { readline.close(); res(ans); }));
    if (answer.toLowerCase() !== 'y') { log('Aborted.'); return; }

    // Delete all stores (cascades to categories + items)
    const ids = (await sb.from('stores').select('id')).data?.map(s => s.id) || [];
    if (ids.length) await sb.from('stores').delete().in('id', ids);
    ok('Cleared existing stores');
  }

  let totalStores = 0, totalCats = 0, totalItems = 0;

  for (const data of STORES) {
    const store = await insert('stores', data.store);
    ok(`Store: ${store.name_ar}`);
    totalStores++;

    // Build category name → id map
    const catMap = {};
    for (const catName of data.categories) {
      const cat = await insert('menu_categories', {
        store_id: store.id, name: catName, name_ar: catName, sort_order: Object.keys(catMap).length, is_active: true,
      });
      catMap[catName] = cat.id;
      totalCats++;
    }

    // Insert items
    let sortOrder = 0;
    for (const item of data.items) {
      await insert('menu_items', {
        store_id:       store.id,
        category_id:    catMap[item.cat] || null,
        name:           item.name,
        name_ar:        item.name_ar,
        description:    item.desc || null,
        description_ar: item.desc_ar || null,
        price:          item.price,
        options:        item.options || [],
        is_available:   true,
        is_popular:     item.is_popular || false,
        is_featured:    item.is_featured || false,
        sort_order:     sortOrder++,
      });
      totalItems++;
    }
    log(`  → ${data.items.length} منتج في ${data.categories.length} فئة`);
  }

  console.log('');
  ok(`تم بنجاح: ${totalStores} متجر | ${totalCats} فئة | ${totalItems} منتج`);
  ok('البيانات موجودة الآن في Supabase وستظهر في التطبيق مباشرة');
}

seed().catch(e => { err(e.message); process.exit(1); });
