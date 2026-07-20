// ─────────────────────────────────────────────────────────────────
// JAHEEZ Asset Mappings — Static require declarations
// This ensures that all components import assets cleanly with TypeScript types.
// ─────────────────────────────────────────────────────────────────

export const ASSETS = {
  // ── Branding & Identity
  branding: {
    logo_red: require('../assets/optimized/branding/logo_concept_red.png'),
    logo_custom: require('../assets/branding/jaheez_logo_custom_cropped.png'),
    search_mark: require('../assets/branding/jaheez_search_mark.png'),
    logo_yellow: require('../assets/optimized/branding/logo_concept_yellow.png'),
    bg_splash: require('../assets/optimized/branding/bg_splash.png'),
  },

  // ── Tab & UI Icons
  icons: {
    home: require('../assets/optimized/icons/icon_home.png'),
    orders: require('../assets/optimized/icons/icon_orders.png'),
    cart: require('../assets/optimized/icons/icon_cart.png'),
    chat: require('../assets/optimized/icons/icon_chat.png'),
    favorites: require('../assets/optimized/icons/icon_favorites.png'),
    middle: require('../assets/optimized/icons/icon_middle.png'),
    
    // Additional high-quality icons
    delete: require('../assets/optimized/icons/icon_delete.png'),
    discount: require('../assets/optimized/icons/icon_discount.png'),
    faq: require('../assets/optimized/icons/icon_faq.png'),
    free: require('../assets/optimized/icons/icon_free.png'),
    like: require('../assets/optimized/icons/icon_like.png'),
    logout: require('../assets/optimized/icons/icon_logout.png'),
    message: require('../assets/optimized/icons/icon_message.png'),
    history: require('../assets/optimized/icons/icon_history.png'),
    order: require('../assets/optimized/icons/icon_order.png'),
    middle_alt: require('../assets/optimized/icons/icon_middle_alt.png'),
  },

  // ── Illustrations
  illustrations: {
    bag_hero: require('../assets/optimized/illustrations/illus_bag_hero.png'),
    scooter: require('../assets/optimized/illustrations/illus_scooter.png'),
    scooter_secondary: require('../assets/optimized/illustrations/illus_scooter_secondary.png'),
    support: require('../assets/optimized/illustrations/illus_support.png'),
    discount: require('../assets/optimized/illustrations/illus_discount.png'),
    
    // Categories
    food: require('../assets/optimized/illustrations/illus_food.png'),
    grocery: require('../assets/optimized/illustrations/illus_grocery.png'),
    pharmacy: require('../assets/optimized/illustrations/illus_pharmacy.png'),
    parcel: require('../assets/optimized/illustrations/illus_parcel.png'),
    errand: require('../assets/optimized/illustrations/illus_errand.png'),

    // Jaheez premium illustration set
    jaheez_food: require('../assets/illustrations/jaheez/food.png'),
    jaheez_grocery: require('../assets/illustrations/jaheez/grocery.png'),
    jaheez_pharmacy: require('../assets/illustrations/jaheez/pharmacy.png'),
    jaheez_parcel: require('../assets/illustrations/jaheez/parcel.png'),
    jaheez_delivery: require('../assets/illustrations/jaheez/delivery.png'),
    jaheez_discount: require('../assets/illustrations/jaheez/discount.png'),
    jaheez_food_bag_large: require('../assets/illustrations/jaheez/food_bag_large.png'),
    jaheez_grocery_large: require('../assets/illustrations/jaheez/grocery_large.png'),
    jaheez_pharmacy_large: require('../assets/illustrations/jaheez/pharmacy_large.png'),
    jaheez_scooter_gift: require('../assets/illustrations/jaheez/scooter_gift.png'),
    jaheez_scooter_large: require('../assets/illustrations/jaheez/scooter_large.png'),
    jaheez_support_agent: require('../assets/illustrations/jaheez/support_agent.png'),
    jaheez_home_background: require('../assets/illustrations/jaheez/home_background.png'),
  },

  // ── Videos
  videos: {
    splash: require('../assets/optimized/videos/video_splash.webm'),
  },

  // ── Maps & Markers placeholders (for later implementation)
  map: {
    // Add real map assets here when available
  }
} as const;
