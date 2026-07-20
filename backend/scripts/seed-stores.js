#!/usr/bin/env node
/**
 * JAHEEZ — Seed 20 Real Moroccan Stores + Products + Option Groups
 *
 * Usage:  node backend/scripts/seed-stores.js
 *
 * This script inserts stores, menu_categories, and menu_items (with options JSONB)
 * directly into Supabase using the service-role key.
 *
 * Safety: Checks if stores already exist by name before inserting.
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// ── Load env ────────────────────────────────────────────
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Unsplash image helpers ──────────────────────────────
const IMG = {
  // Store covers & logos
  pastry1: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=500&fit=crop',
  pastry2: 'https://images.unsplash.com/photo-1486427944544-d2c246c4df14?w=800&h=500&fit=crop',
  pastry3: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800&h=500&fit=crop',
  food1: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop',
  food2: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=500&fit=crop',
  food3: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=500&fit=crop',
  coffee1: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=500&fit=crop',
  coffee2: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=500&fit=crop',
  grocery: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=500&fit=crop',
  pharmacy: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&h=500&fit=crop',
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=500&fit=crop',
  chicken: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&h=500&fit=crop',
  shawarma: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&h=500&fit=crop',
  seafood: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&h=500&fit=crop',
  juice: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800&h=500&fit=crop',
  crepe: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800&h=500&fit=crop',

  // Product images
  tagine: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=520&h=360&fit=crop',
  couscous: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=520&h=360&fit=crop',
  pastilla: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=520&h=360&fit=crop',
  harira: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=520&h=360&fit=crop',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=520&h=360&fit=crop',
  brownie: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=520&h=360&fit=crop',
  eclair: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=520&h=360&fit=crop',
  croissant: 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=520&h=360&fit=crop',
  latte: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=520&h=360&fit=crop',
  cappuccino: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=520&h=360&fit=crop',
  espresso: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=520&h=360&fit=crop',
  icedcoffee: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=520&h=360&fit=crop',
  mojito: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=520&h=360&fit=crop',
  smoothie: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=520&h=360&fit=crop',
  pizzaSlice: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=520&h=360&fit=crop',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=520&h=360&fit=crop',
  shawarmaP: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=520&h=360&fit=crop',
  fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=520&h=360&fit=crop',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=520&h=360&fit=crop',
  baklava: 'https://images.unsplash.com/photo-1633252568193-8cc0b69f2e86?w=520&h=360&fit=crop',
  msemen: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=520&h=360&fit=crop',
  rfissa: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=520&h=360&fit=crop',
  grilledFish: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=520&h=360&fit=crop',
  friedChicken: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=520&h=360&fit=crop',
  wrap: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=520&h=360&fit=crop',
  tea: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=520&h=360&fit=crop',
  waffle: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=520&h=360&fit=crop',
  crepeProd: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=520&h=360&fit=crop',
  sandwich: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=520&h=360&fit=crop',
  mille: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=520&h=360&fit=crop',
  panini: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=520&h=360&fit=crop',
  taco: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=520&h=360&fit=crop',
};

// ── Common option templates ─────────────────────────────
const OPT = {
  drinkSide: [
    { id: 'drink-side', name_ar: 'مشروب مرافق', type: 'optional', options: [
      { id: 'ds-water', name_ar: 'ماء معدني', price_delta: 5 },
      { id: 'ds-soda', name_ar: 'مشروب غازي', price_delta: 8 },
      { id: 'ds-juice', name_ar: 'عصير طبيعي', price_delta: 12 },
    ]},
  ],
  protein: [
    { id: 'protein', name_ar: 'نوع اللحم', type: 'required', options: [
      { id: 'pr-chicken', name_ar: 'دجاج', price_delta: 0 },
      { id: 'pr-beef', name_ar: 'لحم بقري', price_delta: 10 },
      { id: 'pr-lamb', name_ar: 'لحم غنم', price_delta: 15 },
    ]},
  ],
  pizzaSize: [
    { id: 'pizza-size', name_ar: 'الحجم', type: 'required', options: [
      { id: 'ps-s', name_ar: 'صغير (شخص واحد)', price_delta: 0 },
      { id: 'ps-m', name_ar: 'وسط (2-3 أشخاص)', price_delta: 20 },
      { id: 'ps-l', name_ar: 'كبير (4-5 أشخاص)', price_delta: 40 },
    ]},
  ],
  pizzaExtras: [
    { id: 'pizza-extras', name_ar: 'إضافات', type: 'optional', options: [
      { id: 'pe-olives', name_ar: 'زيتون', price_delta: 5 },
      { id: 'pe-mushroom', name_ar: 'فطر', price_delta: 8 },
      { id: 'pe-pepper', name_ar: 'فلفل حار', price_delta: 3 },
      { id: 'pe-cheese', name_ar: 'جبن إضافي', price_delta: 10 },
    ]},
  ],
  coffeeSize: [
    { id: 'coffee-size', name_ar: 'الحجم', type: 'required', options: [
      { id: 'cs-s', name_ar: 'صغير', price_delta: 0 },
      { id: 'cs-m', name_ar: 'وسط', price_delta: 5 },
      { id: 'cs-l', name_ar: 'كبير', price_delta: 10 },
    ]},
  ],
  milkType: [
    { id: 'milk-type', name_ar: 'نوع الحليب', type: 'required', options: [
      { id: 'mt-regular', name_ar: 'حليب عادي', price_delta: 0 },
      { id: 'mt-oat', name_ar: 'حليب شوفان', price_delta: 5 },
      { id: 'mt-almond', name_ar: 'حليب لوز', price_delta: 5 },
    ]},
  ],
  coffeeExtras: [
    { id: 'coffee-extras', name_ar: 'إضافات', type: 'optional', options: [
      { id: 'ce-shot', name_ar: 'شوت إسبريسو إضافي', price_delta: 5 },
      { id: 'ce-vanilla', name_ar: 'سيروب فانيلا', price_delta: 3 },
      { id: 'ce-caramel', name_ar: 'سيروب كراميل', price_delta: 3 },
      { id: 'ce-whip', name_ar: 'كريمة مخفوقة', price_delta: 5 },
    ]},
  ],
  cakeSize: [
    { id: 'cake-size', name_ar: 'الحجم', type: 'required', options: [
      { id: 'ck-s', name_ar: 'قطعة واحدة', price_delta: 0 },
      { id: 'ck-m', name_ar: 'نصف كيلو', price_delta: 30 },
      { id: 'ck-l', name_ar: '1 كيلو', price_delta: 70 },
    ]},
  ],
  cakeExtras: [
    { id: 'cake-extras', name_ar: 'إضافات', type: 'optional', options: [
      { id: 'ke-cream', name_ar: 'كريمة إضافية', price_delta: 8 },
      { id: 'ke-nuts', name_ar: 'مكسرات', price_delta: 10 },
      { id: 'ke-choc', name_ar: 'صوص شوكولاتة', price_delta: 5 },
      { id: 'ke-fruit', name_ar: 'فواكه طازجة', price_delta: 12 },
    ]},
  ],
  sides: [
    { id: 'sides', name_ar: 'أطباق جانبية', type: 'optional', options: [
      { id: 'sd-bread', name_ar: 'خبز بلدي', price_delta: 3 },
      { id: 'sd-salad', name_ar: 'سلطة مغربية', price_delta: 10 },
      { id: 'sd-fries', name_ar: 'بطاطس مقلية', price_delta: 12 },
      { id: 'sd-rice', name_ar: 'أرز', price_delta: 10 },
    ]},
  ],
  spiceLevel: [
    { id: 'spice', name_ar: 'مستوى الحرارة', type: 'required', options: [
      { id: 'sp-mild', name_ar: 'عادي', price_delta: 0 },
      { id: 'sp-med', name_ar: 'متوسط الحرارة', price_delta: 0 },
      { id: 'sp-hot', name_ar: 'حار', price_delta: 0 },
    ]},
  ],
  sauces: [
    { id: 'sauces', name_ar: 'الصلصات', type: 'optional', options: [
      { id: 'sc-garlic', name_ar: 'صلصة ثومية', price_delta: 3 },
      { id: 'sc-harissa', name_ar: 'هريسة', price_delta: 3 },
      { id: 'sc-ketchup', name_ar: 'كاتشب', price_delta: 0 },
      { id: 'sc-mayo', name_ar: 'مايونيز', price_delta: 0 },
    ]},
  ],
};

// Safi coordinates (approximate center)
const SAFI_LAT = 32.2994;
const SAFI_LNG = -9.2372;

function jitter(base, range = 0.015) {
  return +(base + (Math.random() - 0.5) * range).toFixed(6);
}

// ── Store definitions ───────────────────────────────────
const STORES = [
  {
    store: { name: 'Rose Pâtisserie', name_ar: 'روز باتيسري', category: 'food', logo_url: IMG.pastry1, delivery_fee: 5, delivery_time_min: 20, delivery_time_max: 35, is_featured: true, rating_avg: 4.8, rating_count: 512 },
    categories: [
      { name: 'Cakes', name_ar: 'كيك', items: [
        { name_ar: 'كيكة روز الفستق', description_ar: 'طبقات من الكيك الوردي والفستق مع موس الورد وصوص التوت الطبيعي.', price: 45, image_url: IMG.cake, is_popular: true, options: [...OPT.cakeSize, ...OPT.cakeExtras] },
        { name_ar: 'موس شوكولاتة', description_ar: 'موس شوكولاتة بلجيكية مع كراميل مقرمش وقاعدة براوني.', price: 42, image_url: IMG.brownie, options: [...OPT.cakeExtras] },
        { name_ar: 'ميل فوي', description_ar: 'طبقات من العجين المورق والكريمة الباتيسيار بنكهة الفانيلا.', price: 35, image_url: IMG.mille, options: [...OPT.cakeExtras] },
      ]},
      { name: 'Pastries', name_ar: 'معجنات', items: [
        { name_ar: 'إكلير شوكولاتة', description_ar: 'إكلير فرنسي محشو بكريمة الشوكولاتة ومغطى بالجاناش.', price: 18, image_url: IMG.eclair, options: [] },
        { name_ar: 'كرواسون زبدة', description_ar: 'كرواسون كلاسيكي بالزبدة الفرنسية الطازجة.', price: 12, image_url: IMG.croissant, options: [] },
        { name_ar: 'بقلاوة بالفستق', description_ar: 'بقلاوة تركية فاخرة محشوة بالفستق الحلبي والقطر الخفيف.', price: 38, image_url: IMG.baklava, options: [{ id: 'bak-pack', name_ar: 'العبوة', type: 'required', options: [{ id: 'bp-6', name_ar: '6 قطع', price_delta: 0 }, { id: 'bp-12', name_ar: '12 قطعة', price_delta: 30 }] }] },
      ]},
    ],
  },
  {
    store: { name: 'Atlas Restaurant', name_ar: 'مطعم الأطلس', category: 'food', logo_url: IMG.food1, delivery_fee: 10, delivery_time_min: 25, delivery_time_max: 45, is_featured: true, rating_avg: 4.6, rating_count: 320 },
    categories: [
      { name: 'Tagines', name_ar: 'الطواجن', items: [
        { name_ar: 'طاجين بالدجاج والزيتون', description_ar: 'طاجين تقليدي بالدجاج البلدي والزيتون والحامض المصير.', price: 55, image_url: IMG.tagine, is_popular: true, options: [...OPT.protein, ...OPT.sides, ...OPT.drinkSide] },
        { name_ar: 'طاجين كفتة بالبيض', description_ar: 'كفتة لحم بقري مع صلصة الطماطم والبيض البلدي.', price: 50, image_url: IMG.tagine, options: [...OPT.sides, ...OPT.drinkSide] },
        { name_ar: 'طاجين بالبرقوق واللوز', description_ar: 'لحم غنم طري مع البرقوق المجفف واللوز المحمص والعسل.', price: 65, image_url: IMG.tagine, options: [...OPT.sides, ...OPT.drinkSide] },
      ]},
      { name: 'Main', name_ar: 'أطباق رئيسية', items: [
        { name_ar: 'كسكس الجمعة', description_ar: 'كسكس تقليدي بسبع خضار مع اللحم أو الدجاج.', price: 60, image_url: IMG.couscous, is_popular: true, options: [...OPT.protein, ...OPT.drinkSide] },
        { name_ar: 'بسطيلة بالدجاج', description_ar: 'بسطيلة فاسية بالدجاج واللوز مع القرفة والسكر.', price: 70, image_url: IMG.pastilla, options: [...OPT.drinkSide] },
        { name_ar: 'حريرة مغربية', description_ar: 'شوربة حريرة غنية بالحمص والعدس والطماطم والكزبرة.', price: 20, image_url: IMG.harira, options: [...OPT.drinkSide] },
      ]},
    ],
  },
  {
    store: { name: 'Café Nesma', name_ar: 'كافيه نسمة', category: 'food', logo_url: IMG.coffee1, delivery_fee: 0, delivery_time_min: 15, delivery_time_max: 25, is_featured: true, rating_avg: 4.7, rating_count: 280 },
    categories: [
      { name: 'Hot Drinks', name_ar: 'مشروبات ساخنة', items: [
        { name_ar: 'لاتيه', description_ar: 'إسبريسو مع حليب مبخر ورغوة ناعمة.', price: 22, image_url: IMG.latte, is_popular: true, options: [...OPT.coffeeSize, ...OPT.milkType, ...OPT.coffeeExtras] },
        { name_ar: 'كابتشينو', description_ar: 'إسبريسو مع رغوة حليب كثيفة وكاكاو.', price: 24, image_url: IMG.cappuccino, options: [...OPT.coffeeSize, ...OPT.milkType, ...OPT.coffeeExtras] },
        { name_ar: 'إسبريسو', description_ar: 'شوت إسبريسو مزدوج من حبوب أرابيكا.', price: 15, image_url: IMG.espresso, options: [...OPT.coffeeExtras] },
        { name_ar: 'شاي مغربي بالنعناع', description_ar: 'شاي أخضر تقليدي بالنعناع الطازج.', price: 12, image_url: IMG.tea, options: [] },
      ]},
      { name: 'Cold Drinks', name_ar: 'مشروبات باردة', items: [
        { name_ar: 'آيس لاتيه', description_ar: 'لاتيه مثلج منعش مع الحليب البارد.', price: 28, image_url: IMG.icedcoffee, options: [...OPT.coffeeSize, ...OPT.milkType, ...OPT.coffeeExtras] },
        { name_ar: 'موخيتو', description_ar: 'نعناع طازج مع ليمون وسكر وصودا.', price: 25, image_url: IMG.mojito, options: [...OPT.coffeeSize] },
      ]},
    ],
  },
  {
    store: { name: 'Saada Bakery', name_ar: 'مخبزة السعادة', category: 'food', logo_url: IMG.pastry2, delivery_fee: 5, delivery_time_min: 15, delivery_time_max: 30, is_featured: false, rating_avg: 4.5, rating_count: 190 },
    categories: [
      { name: 'Bread', name_ar: 'خبز ومعجنات', items: [
        { name_ar: 'مسمن بالعسل', description_ar: 'مسمن مغربي مع عسل طبيعي وزبدة.', price: 10, image_url: IMG.msemen, options: [] },
        { name_ar: 'بغرير', description_ar: 'ألف ثقب — فطيرة مغربية تقدم مع عسل وزبدة.', price: 8, image_url: IMG.msemen, options: [{ id: 'bg-pack', name_ar: 'الكمية', type: 'required', options: [{ id: 'bg-3', name_ar: '3 قطع', price_delta: 0 }, { id: 'bg-6', name_ar: '6 قطع', price_delta: 8 }, { id: 'bg-12', name_ar: '12 قطعة', price_delta: 18 }] }] },
        { name_ar: 'خبز بلدي', description_ar: 'خبز مغربي تقليدي طازج من الفرن.', price: 3, image_url: IMG.msemen, options: [] },
      ]},
      { name: 'Pastries', name_ar: 'حلويات', items: [
        { name_ar: 'كعب غزال', description_ar: 'حلوى مغربية باللوز وماء الزهر.', price: 25, image_url: IMG.baklava, options: [{ id: 'kg-pack', name_ar: 'العبوة', type: 'required', options: [{ id: 'kg-250', name_ar: '250 غرام', price_delta: 0 }, { id: 'kg-500', name_ar: '500 غرام', price_delta: 22 }, { id: 'kg-1000', name_ar: '1 كيلو', price_delta: 50 }] }] },
        { name_ar: 'غريبة', description_ar: 'بسكويت مغربي هش بالسميدة واللوز.', price: 20, image_url: IMG.baklava, options: [] },
      ]},
    ],
  },
  {
    store: { name: 'Dar Tajine', name_ar: 'دار الطاجين', category: 'food', logo_url: IMG.food2, delivery_fee: 8, delivery_time_min: 30, delivery_time_max: 50, is_featured: true, rating_avg: 4.9, rating_count: 450 },
    categories: [
      { name: 'Tagines', name_ar: 'طواجن', items: [
        { name_ar: 'طاجين مرقاز', description_ar: 'نقانق مرقاز حارة مع صلصة الطماطم والبيض.', price: 45, image_url: IMG.tagine, is_popular: true, options: [...OPT.spiceLevel, ...OPT.sides, ...OPT.drinkSide] },
        { name_ar: 'طاجين الحوت', description_ar: 'طاجين سمك بالشرمولة والخضار على الطريقة الصافوية.', price: 70, image_url: IMG.grilledFish, is_popular: true, options: [...OPT.sides, ...OPT.drinkSide] },
      ]},
      { name: 'Specials', name_ar: 'تخصصات الدار', items: [
        { name_ar: 'رفيسة', description_ar: 'دجاج بلدي مع المسمن والعدس والرأس الحانوت.', price: 75, image_url: IMG.rfissa, options: [...OPT.drinkSide] },
        { name_ar: 'تريد بالدجاج', description_ar: 'عجين رقيق مع دجاج ومرق البصل والعدس.', price: 55, image_url: IMG.rfissa, options: [...OPT.drinkSide] },
      ]},
    ],
  },
  {
    store: { name: 'Pizza Plaza', name_ar: 'بيتزا بلازا', category: 'food', logo_url: IMG.pizza, delivery_fee: 10, delivery_time_min: 20, delivery_time_max: 40, is_featured: false, rating_avg: 4.3, rating_count: 175 },
    categories: [
      { name: 'Pizza', name_ar: 'بيتزا', items: [
        { name_ar: 'مارغريتا', description_ar: 'صلصة طماطم، موزاريلا، ريحان طازج.', price: 40, image_url: IMG.pizzaSlice, is_popular: true, options: [...OPT.pizzaSize, ...OPT.pizzaExtras] },
        { name_ar: 'بيتزا بولونيز', description_ar: 'لحم بقري مفروم مع صلصة بولونيز والجبن.', price: 50, image_url: IMG.pizzaSlice, options: [...OPT.pizzaSize, ...OPT.pizzaExtras] },
        { name_ar: 'بيتزا تونة', description_ar: 'تونة مع بصل وزيتون وفلفل ملون.', price: 45, image_url: IMG.pizzaSlice, options: [...OPT.pizzaSize, ...OPT.pizzaExtras] },
        { name_ar: 'بيتزا 4 أجبان', description_ar: 'موزاريلا، شيدر، بارميزان، جبن أزرق.', price: 55, image_url: IMG.pizzaSlice, options: [...OPT.pizzaSize, ...OPT.pizzaExtras] },
      ]},
      { name: 'Sides', name_ar: 'أطباق جانبية', items: [
        { name_ar: 'بطاطس مقلية', description_ar: 'بطاطس مقرمشة مع صلصة كاتشب.', price: 15, image_url: IMG.fries, options: [...OPT.sauces] },
        { name_ar: 'سلطة سيزر', description_ar: 'خس، قطع دجاج مشوي، خبز محمص، صلصة سيزر.', price: 30, image_url: IMG.salad, options: [] },
      ]},
    ],
  },
  {
    store: { name: 'Spring Juices', name_ar: 'عصائر الربيع', category: 'food', logo_url: IMG.juice, delivery_fee: 5, delivery_time_min: 10, delivery_time_max: 20, is_featured: false, rating_avg: 4.4, rating_count: 130 },
    categories: [
      { name: 'Juices', name_ar: 'عصائر طازجة', items: [
        { name_ar: 'عصير برتقال', description_ar: 'برتقال طازج معصور.', price: 15, image_url: IMG.juice, is_popular: true, options: [...OPT.coffeeSize] },
        { name_ar: 'أفوكادو بالحليب', description_ar: 'أفوكادو كريمي مع حليب ولوز.', price: 25, image_url: IMG.smoothie, options: [...OPT.coffeeSize] },
        { name_ar: 'سموذي فواكه', description_ar: 'مزيج من الموز والفراولة والمانجو.', price: 28, image_url: IMG.smoothie, options: [...OPT.coffeeSize] },
        { name_ar: 'عصير جزر وزنجبيل', description_ar: 'جزر طازج مع زنجبيل وليمون.', price: 18, image_url: IMG.juice, options: [...OPT.coffeeSize] },
      ]},
    ],
  },
  {
    store: { name: 'Sultan Restaurant', name_ar: 'مطعم السلطان', category: 'food', logo_url: IMG.food3, delivery_fee: 12, delivery_time_min: 30, delivery_time_max: 50, is_featured: true, rating_avg: 4.7, rating_count: 380 },
    categories: [
      { name: 'Grills', name_ar: 'مشويات', items: [
        { name_ar: 'مشاوي مشكلة', description_ar: 'تشكيلة من الكفتة والدجاج ولحم الغنم المشوي.', price: 85, image_url: IMG.tagine, is_popular: true, options: [...OPT.sides, ...OPT.sauces, ...OPT.drinkSide] },
        { name_ar: 'كفتة مشوية', description_ar: 'أسياخ كفتة لحم بقري متبلة على الفحم.', price: 45, image_url: IMG.tagine, options: [...OPT.sides, ...OPT.sauces, ...OPT.drinkSide] },
        { name_ar: 'دجاج مشوي', description_ar: 'نصف دجاج متبل ومشوي على الفحم.', price: 50, image_url: IMG.friedChicken, options: [...OPT.sides, ...OPT.sauces, ...OPT.drinkSide] },
      ]},
      { name: 'Soups', name_ar: 'شوربات', items: [
        { name_ar: 'حريرة', description_ar: 'شوربة مغربية تقليدية.', price: 18, image_url: IMG.harira, options: [] },
      ]},
    ],
  },
  {
    store: { name: 'Andalus Sweets', name_ar: 'حلويات الأندلس', category: 'food', logo_url: IMG.pastry3, delivery_fee: 8, delivery_time_min: 20, delivery_time_max: 35, is_featured: false, rating_avg: 4.5, rating_count: 210 },
    categories: [
      { name: 'Traditional', name_ar: 'حلويات تقليدية', items: [
        { name_ar: 'سلو', description_ar: 'خليط من اللوز والسمسم والدقيق المحمص والعسل.', price: 35, image_url: IMG.baklava, options: [{ id: 'slou-wt', name_ar: 'الوزن', type: 'required', options: [{ id: 'sl-250', name_ar: '250 غرام', price_delta: 0 }, { id: 'sl-500', name_ar: '500 غرام', price_delta: 30 }, { id: 'sl-1000', name_ar: '1 كيلو', price_delta: 65 }] }] },
        { name_ar: 'بريوات باللوز', description_ar: 'مثلثات من ورق البريك محشوة باللوز والعسل.', price: 30, image_url: IMG.baklava, is_popular: true, options: [] },
        { name_ar: 'شباكية', description_ar: 'حلوى رمضانية مقلية مغموسة في العسل والسمسم.', price: 28, image_url: IMG.baklava, options: [] },
      ]},
      { name: 'Modern', name_ar: 'حلويات عصرية', items: [
        { name_ar: 'تشيز كيك توت', description_ar: 'تشيز كيك كريمي مع صوص التوت الطازج.', price: 38, image_url: IMG.cake, options: [...OPT.cakeExtras] },
      ]},
    ],
  },
  {
    store: { name: 'Sobirat Market', name_ar: 'سوبيرات ماركت', category: 'grocery', logo_url: IMG.grocery, delivery_fee: 10, delivery_time_min: 20, delivery_time_max: 40, is_featured: false, rating_avg: 4.2, rating_count: 95 },
    categories: [
      { name: 'Essentials', name_ar: 'أساسيات', items: [
        { name_ar: 'حليب طازج 1 لتر', description_ar: 'حليب كامل الدسم طازج.', price: 8, image_url: IMG.grocery, options: [] },
        { name_ar: 'بيض بلدي 30', description_ar: 'بيض بلدي طازج، طبق 30 حبة.', price: 45, image_url: IMG.grocery, options: [] },
        { name_ar: 'زيت زيتون 1 لتر', description_ar: 'زيت زيتون بكر ممتاز من الشمال.', price: 65, image_url: IMG.grocery, options: [] },
        { name_ar: 'سكر 1 كيلو', description_ar: 'سكر أبيض ناعم.', price: 8, image_url: IMG.grocery, options: [] },
      ]},
    ],
  },
  {
    store: { name: 'Shifa Pharmacy', name_ar: 'صيدلية الشفاء', category: 'pharmacy', logo_url: IMG.pharmacy, delivery_fee: 10, delivery_time_min: 15, delivery_time_max: 30, is_featured: false, rating_avg: 4.6, rating_count: 85 },
    categories: [
      { name: 'OTC', name_ar: 'أدوية بدون وصفة', items: [
        { name_ar: 'دوليبران 1000 ملغ', description_ar: 'مسكن للآلام وخافض للحرارة، 8 أقراص.', price: 15, image_url: IMG.pharmacy, options: [] },
        { name_ar: 'فيتامين C 1000', description_ar: 'أقراص فوارة، 20 قرص.', price: 45, image_url: IMG.pharmacy, options: [] },
        { name_ar: 'ماء ميسيلار', description_ar: 'منظف وجه لطيف، 400 مل.', price: 80, image_url: IMG.pharmacy, options: [] },
      ]},
    ],
  },
  {
    store: { name: 'Sham Shawarma', name_ar: 'شاورما الشام', category: 'food', logo_url: IMG.shawarma, delivery_fee: 8, delivery_time_min: 15, delivery_time_max: 30, is_featured: true, rating_avg: 4.5, rating_count: 260 },
    categories: [
      { name: 'Shawarma', name_ar: 'شاورما', items: [
        { name_ar: 'شاورما دجاج', description_ar: 'شاورما دجاج مع مخللات وثومية وبطاطس.', price: 30, image_url: IMG.shawarmaP, is_popular: true, options: [...OPT.sauces, ...OPT.drinkSide] },
        { name_ar: 'شاورما لحم', description_ar: 'شاورما لحم بقري مع طحينة وخضار.', price: 35, image_url: IMG.shawarmaP, options: [...OPT.sauces, ...OPT.drinkSide] },
        { name_ar: 'بلاتو شاورما مشكل', description_ar: 'تشكيلة من شاورما الدجاج واللحم مع أرز وسلطة.', price: 65, image_url: IMG.shawarmaP, options: [...OPT.sauces, ...OPT.drinkSide] },
      ]},
      { name: 'Wraps', name_ar: 'لفائف', items: [
        { name_ar: 'تاكوس دجاج', description_ar: 'لفائف تاكوس مع دجاج متبل وصلصة حارة.', price: 28, image_url: IMG.taco, options: [...OPT.spiceLevel, ...OPT.sauces] },
        { name_ar: 'راب دجاج مشوي', description_ar: 'خبز تورتيلا مع دجاج مشوي وخضار وصلصة رانش.', price: 32, image_url: IMG.wrap, options: [...OPT.sauces] },
      ]},
    ],
  },
  {
    store: { name: 'Ocean Restaurant', name_ar: 'مطعم المحيط', category: 'food', logo_url: IMG.seafood, delivery_fee: 15, delivery_time_min: 25, delivery_time_max: 45, is_featured: true, rating_avg: 4.8, rating_count: 340 },
    categories: [
      { name: 'Fish', name_ar: 'أسماك', items: [
        { name_ar: 'سمك مشوي', description_ar: 'سمك طازج مشوي على الفحم مع الشرمولة المغربية.', price: 65, image_url: IMG.grilledFish, is_popular: true, options: [...OPT.sides, ...OPT.drinkSide] },
        { name_ar: 'سردين محشي', description_ar: 'سردين محشي بالشرمولة ومقلي.', price: 40, image_url: IMG.grilledFish, options: [...OPT.sides, ...OPT.drinkSide] },
        { name_ar: 'فريتو ميستو', description_ar: 'تشكيلة مقلية من الكالماري والجمبري والسمك.', price: 75, image_url: IMG.grilledFish, is_popular: true, options: [...OPT.sauces, ...OPT.drinkSide] },
      ]},
    ],
  },
  {
    store: { name: 'Crêpe & Waffle', name_ar: 'كريب وافل', category: 'food', logo_url: IMG.crepe, delivery_fee: 8, delivery_time_min: 15, delivery_time_max: 25, is_featured: false, rating_avg: 4.4, rating_count: 155 },
    categories: [
      { name: 'Crepes', name_ar: 'كريب', items: [
        { name_ar: 'كريب نوتيلا', description_ar: 'كريب مع نوتيلا وموز وفول سوداني.', price: 22, image_url: IMG.crepeProd, is_popular: true, options: [{ id: 'crp-top', name_ar: 'إضافات', type: 'optional', options: [{ id: 'ct-straw', name_ar: 'فراولة', price_delta: 5 }, { id: 'ct-icecr', name_ar: 'آيس كريم', price_delta: 8 }, { id: 'ct-whip', name_ar: 'كريمة مخفوقة', price_delta: 5 }] }] },
        { name_ar: 'كريب مالح بالجبن', description_ar: 'كريب محشو بالجبن والزيتون والطماطم.', price: 20, image_url: IMG.crepeProd, options: [] },
      ]},
      { name: 'Waffles', name_ar: 'وافل', items: [
        { name_ar: 'وافل بلجيكي', description_ar: 'وافل مقرمش مع شوكولاتة وفواكه طازجة.', price: 28, image_url: IMG.waffle, options: [{ id: 'waf-top', name_ar: 'إضافات', type: 'optional', options: [{ id: 'wt-choc', name_ar: 'صوص شوكولاتة', price_delta: 5 }, { id: 'wt-car', name_ar: 'صوص كراميل', price_delta: 5 }, { id: 'wt-ice', name_ar: 'آيس كريم', price_delta: 8 }] }] },
      ]},
    ],
  },
  {
    store: { name: 'Baladi Kitchen', name_ar: 'مطعم بلدي', category: 'food', logo_url: IMG.food1, delivery_fee: 8, delivery_time_min: 20, delivery_time_max: 40, is_featured: false, rating_avg: 4.3, rating_count: 140 },
    categories: [
      { name: 'Traditional', name_ar: 'أطباق تقليدية', items: [
        { name_ar: 'طنجية مراكشية', description_ar: 'لحم بقري مطهو ببطء مع الزعفران والكمون وليمون مصير.', price: 70, image_url: IMG.tagine, is_popular: true, options: [...OPT.sides, ...OPT.drinkSide] },
        { name_ar: 'مشوي بالتين', description_ar: 'لحم غنم مع تين مجفف وعسل ولوز.', price: 80, image_url: IMG.tagine, options: [...OPT.drinkSide] },
        { name_ar: 'سفة بالدجاج', description_ar: 'شعرية مغربية مبخرة مع دجاج وبصل مكرمل.', price: 55, image_url: IMG.couscous, options: [...OPT.drinkSide] },
      ]},
    ],
  },
  {
    store: { name: 'Latte Art Café', name_ar: 'كافيه لاتيه آرت', category: 'food', logo_url: IMG.coffee2, delivery_fee: 0, delivery_time_min: 10, delivery_time_max: 20, is_featured: true, rating_avg: 4.6, rating_count: 200 },
    categories: [
      { name: 'Specialty', name_ar: 'قهوة مختصة', items: [
        { name_ar: 'فلات وايت', description_ar: 'قهوة أسترالية مع حليب مخملي.', price: 26, image_url: IMG.latte, is_popular: true, options: [...OPT.coffeeSize, ...OPT.milkType, ...OPT.coffeeExtras] },
        { name_ar: 'V60 بور أوفر', description_ar: 'قهوة مقطرة من حبوب إثيوبية مغسولة.', price: 30, image_url: IMG.espresso, options: [...OPT.coffeeSize] },
        { name_ar: 'كولد برو', description_ar: 'قهوة باردة منقوعة 18 ساعة.', price: 28, image_url: IMG.icedcoffee, options: [...OPT.coffeeSize, ...OPT.coffeeExtras] },
        { name_ar: 'ماتشا لاتيه', description_ar: 'شاي ماتشا ياباني مع حليب مبخر.', price: 30, image_url: IMG.latte, options: [...OPT.coffeeSize, ...OPT.milkType] },
      ]},
      { name: 'Pastries', name_ar: 'معجنات', items: [
        { name_ar: 'كوكيز شوكولاتة', description_ar: 'كوكيز طري بقطع الشوكولاتة الداكنة.', price: 15, image_url: IMG.brownie, options: [] },
        { name_ar: 'بان أو شوكولا', description_ar: 'كرواسون شوكولاتة فرنسي.', price: 14, image_url: IMG.croissant, options: [] },
      ]},
    ],
  },
  {
    store: { name: 'Sayyad Restaurant', name_ar: 'مطعم الصيّاد', category: 'food', logo_url: IMG.seafood, delivery_fee: 12, delivery_time_min: 25, delivery_time_max: 45, is_featured: false, rating_avg: 4.6, rating_count: 180 },
    categories: [
      { name: 'Seafood', name_ar: 'مأكولات بحرية', items: [
        { name_ar: 'جمبري مشوي', description_ar: 'جمبري كبير مشوي بالثوم والزبدة.', price: 80, image_url: IMG.grilledFish, is_popular: true, options: [...OPT.sides, ...OPT.drinkSide] },
        { name_ar: 'طاجين سمك', description_ar: 'سمك مع بطاطس وطماطم وفلفل في طاجين.', price: 60, image_url: IMG.grilledFish, options: [...OPT.drinkSide] },
        { name_ar: 'سلطة بحرية', description_ar: 'تشكيلة مأكولات بحرية مع خضار طازجة وصلصة ليمون.', price: 55, image_url: IMG.salad, options: [...OPT.drinkSide] },
      ]},
    ],
  },
  {
    store: { name: 'Queen Pastries', name_ar: 'فطائر الملكة', category: 'food', logo_url: IMG.pastry1, delivery_fee: 5, delivery_time_min: 15, delivery_time_max: 30, is_featured: false, rating_avg: 4.4, rating_count: 120 },
    categories: [
      { name: 'Savory', name_ar: 'مالح', items: [
        { name_ar: 'بسطيلة بالسمك', description_ar: 'بسطيلة بالسمك والشعرية الصينية.', price: 30, image_url: IMG.pastilla, is_popular: true, options: [...OPT.drinkSide] },
        { name_ar: 'فطيرة باللحم', description_ar: 'عجينة مورقة محشوة بلحم بقري متبل.', price: 25, image_url: IMG.msemen, options: [] },
        { name_ar: 'بريوات بالدجاج', description_ar: 'مثلثات بعجين الفيلو محشوة بدجاج وبصل.', price: 20, image_url: IMG.msemen, options: [] },
      ]},
      { name: 'Sweet', name_ar: 'حلو', items: [
        { name_ar: 'فطيرة بالتفاح', description_ar: 'فطيرة تفاح دافئة مع قرفة.', price: 22, image_url: IMG.cake, options: [...OPT.cakeExtras] },
      ]},
    ],
  },
  {
    store: { name: 'Al Khair Supermarket', name_ar: 'سوبرماركت الخير', category: 'grocery', logo_url: IMG.grocery, delivery_fee: 10, delivery_time_min: 15, delivery_time_max: 35, is_featured: false, rating_avg: 4.1, rating_count: 70 },
    categories: [
      { name: 'Fresh', name_ar: 'طازج', items: [
        { name_ar: 'خضار مشكلة 1كغ', description_ar: 'تشكيلة خضار طازجة من السوق.', price: 15, image_url: IMG.grocery, options: [] },
        { name_ar: 'فواكه موسمية 1كغ', description_ar: 'فواكه الموسم الطازجة.', price: 20, image_url: IMG.grocery, options: [] },
        { name_ar: 'دجاج بلدي', description_ar: 'دجاج بلدي كامل طازج.', price: 80, image_url: IMG.grocery, options: [] },
      ]},
      { name: 'Pantry', name_ar: 'مؤونة', items: [
        { name_ar: 'كسكس 1 كيلو', description_ar: 'كسكس مغربي فاخر.', price: 15, image_url: IMG.grocery, options: [] },
        { name_ar: 'عدس 1 كيلو', description_ar: 'عدس أحمر مغربي.', price: 12, image_url: IMG.grocery, options: [] },
      ]},
    ],
  },
  {
    store: { name: 'Broast Chicken', name_ar: 'بروست تشيكن', category: 'food', logo_url: IMG.chicken, delivery_fee: 8, delivery_time_min: 15, delivery_time_max: 30, is_featured: true, rating_avg: 4.4, rating_count: 220 },
    categories: [
      { name: 'Chicken', name_ar: 'دجاج', items: [
        { name_ar: 'بروست 4 قطع', description_ar: 'دجاج بروست مقرمش مع بطاطس وكول سلو.', price: 45, image_url: IMG.friedChicken, is_popular: true, options: [...OPT.spiceLevel, ...OPT.sauces, ...OPT.drinkSide] },
        { name_ar: 'بروست 8 قطع', description_ar: 'وجبة عائلية من البروست مع بطاطس كبيرة وسلطة.', price: 80, image_url: IMG.friedChicken, options: [...OPT.spiceLevel, ...OPT.sauces, ...OPT.drinkSide] },
        { name_ar: 'ستربس دجاج', description_ar: 'شرائح دجاج مقرمشة مع صلصة.', price: 35, image_url: IMG.friedChicken, options: [...OPT.sauces, ...OPT.drinkSide] },
      ]},
      { name: 'Burgers', name_ar: 'برغر', items: [
        { name_ar: 'برغر كلاسيك', description_ar: 'لحم بقري 150غ مع خس وطماطم وجبن.', price: 35, image_url: IMG.burger, options: [...OPT.sauces, ...OPT.drinkSide] },
        { name_ar: 'برغر دجاج كرسبي', description_ar: 'فيليه دجاج مقرمش مع صلصة خاصة.', price: 30, image_url: IMG.burger, options: [...OPT.sauces, ...OPT.drinkSide] },
        { name_ar: 'ساندويتش بانيني', description_ar: 'خبز بانيني مع دجاج مشوي وجبن وخضار.', price: 28, image_url: IMG.panini, options: [...OPT.sauces, ...OPT.drinkSide] },
      ]},
    ],
  },
];

// ── Main seed function ──────────────────────────────────
async function seed() {
  console.log('🚀  JAHEEZ Store Seeder — Starting...\n');

  let storesCreated = 0;
  let categoriesCreated = 0;
  let itemsCreated = 0;

  for (const entry of STORES) {
    const { store, categories } = entry;

    // Check if store already exists by name
    const { data: existing } = await supabase
      .from('stores')
      .select('id')
      .eq('name', store.name)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`⏭️   Skipping "${store.name_ar}" — already exists`);
      continue;
    }

    // Insert store
    const storePayload = {
      name: store.name,
      name_ar: store.name_ar,
      category: store.category,
      logo_url: store.logo_url || null,
      delivery_fee: store.delivery_fee,
      delivery_time: Math.round((store.delivery_time_min + store.delivery_time_max) / 2),
      is_featured: store.is_featured || false,
      is_open: true,
      is_verified: true,
      rating_avg: store.rating_avg || 0,
      rating_count: store.rating_count || 0,
      city: 'آسفي',
      address_ar: 'آسفي، المغرب',
      address: 'Safi, Morocco',
      lat: jitter(SAFI_LAT),
      lng: jitter(SAFI_LNG),
      min_order: 0,
    };

    const { data: newStore, error: storeErr } = await supabase
      .from('stores')
      .insert(storePayload)
      .select('id')
      .single();

    if (storeErr) {
      console.error(`❌  Failed to create store "${store.name_ar}":`, storeErr.message);
      continue;
    }

    const storeId = newStore.id;
    storesCreated++;
    console.log(`✅  Store: ${store.name_ar} (${storeId})`);

    // Insert categories and items
    for (let catIdx = 0; catIdx < categories.length; catIdx++) {
      const cat = categories[catIdx];

      const { data: newCat, error: catErr } = await supabase
        .from('menu_categories')
        .insert({
          store_id: storeId,
          name: cat.name,
          name_ar: cat.name_ar,
          sort_order: catIdx + 1,
          is_active: true,
        })
        .select('id')
        .single();

      if (catErr) {
        console.error(`   ❌  Category "${cat.name_ar}":`, catErr.message);
        continue;
      }

      categoriesCreated++;
      const catId = newCat.id;

      for (let itemIdx = 0; itemIdx < cat.items.length; itemIdx++) {
        const item = cat.items[itemIdx];

        const { error: itemErr } = await supabase
          .from('menu_items')
          .insert({
            store_id: storeId,
            category_id: catId,
            name: item.name_ar,
            name_ar: item.name_ar,
            description: item.description_ar,
            description_ar: item.description_ar,
            price: item.price,
            image_url: item.image_url || null,
            is_available: true,
            is_popular: item.is_popular || false,
            is_featured: item.is_popular || false,
            sort_order: itemIdx + 1,
            options: item.options || [],
          });

        if (itemErr) {
          console.error(`      ❌  Item "${item.name_ar}":`, itemErr.message);
        } else {
          itemsCreated++;
        }
      }
    }
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`✅  Seeding complete!`);
  console.log(`   📦 Stores:     ${storesCreated}`);
  console.log(`   📂 Categories: ${categoriesCreated}`);
  console.log(`   🍽️  Items:      ${itemsCreated}`);
  console.log(`════════════════════════════════════════\n`);
}

seed().catch(err => {
  console.error('💥  Fatal error:', err);
  process.exit(1);
});
