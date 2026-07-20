import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

export type Lang = 'ar' | 'fr' | 'en';
const DEVICE_LANG:Lang=(()=>{const code=getLocales()[0]?.languageCode;return code==='ar'||code==='en'||code==='fr'?code:'fr'})();

export interface Translations {
  // Navigation
  home: string;
  orders: string;
  cart: string;
  search: string;
  account: string;
  newOrder: string;

  // Common
  add: string;
  cancel: string;
  confirm: string;
  save: string;
  edit: string;
  delete: string;
  close: string;
  back: string;
  seeAll: string;
  loading: string;
  error: string;
  free: string;
  minutes: string;
  retry: string;
  loadFailed: string;
  delivery: string;

  // Auth
  login: string;
  loginBtn: string;
  register: string;
  registerBtn: string;
  logout: string;
  phone: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  city: string;
  forgotPassword: string;
  noAccount: string;
  hasAccount: string;
  guestLogin: string;
  guestLoginSub: string;
  continueAsGuest: string;
  welcomeTitle: string;
  welcomeSub: string;

  // Home
  hello: string;
  services: string;
  nearYou: string;
  quickServices: string;
  promoTitle: string;
  promoSub: string;
  orderNow: string;
  food: string;
  grocery: string;
  pharmacy: string;
  parcel: string;
  errand: string;
  fastDelivery: string;
  todayOffers: string;
  trackOrder: string;
  support: string;
  noStores: string;
  noStoresSub: string;

  // Search
  searchPlaceholder: string;
  searchTitle: string;
  recentSearches: string;
  clearAll: string;
  trending: string;
  featuredDishes: string;
  allStores: string;
  noResults: string;
  noResultsSub: string;
  browseAll: string;
  restaurants: string;
  products: string;
  stores: string;
  discover: string;

  // Orders
  myOrders: string;
  ordersSub: string;
  activeOrder: string;
  noOrders: string;
  noOrdersSub: string;
  orderStatus_pending: string;
  orderStatus_confirmed: string;
  orderStatus_preparing: string;
  orderStatus_picked_up: string;
  orderStatus_delivered: string;
  orderStatus_cancelled: string;
  reorder: string;
  viewDetails: string;
  callDriver: string;
  trackDriver: string;
  eta: string;
  deliveredBy: string;
  filterAll: string;
  filterActive: string;
  filterCompleted: string;
  filterCancelled: string;
  activeNow: string;
  stepConfirm: string;
  stepPrepare: string;
  stepPickup: string;
  stepDeliver: string;
  statTotal: string;

  // Profile
  favorites: string;
  paymentMethods: string;
  noFavoriteStores: string;
  noFavoriteProducts: string;
  freeDelivery: string;
  removeFromFavorites: string;

  // Notifications screen
  notifMarkAllRead: string;
  notifEmpty: string;
  notifEmptySub: string;
  notifTypeBroadcast: string;
  notifTypeOrder: string;
  notifTypeSystem: string;

  // Settings
  settings: string;
  notifications: string;
  pushNotifications: string;
  pushNotificationsSub: string;
  orderUpdates: string;
  orderUpdatesSub: string;
  promoNotifications: string;
  promoNotificationsSub: string;
  locationPrivacy: string;
  shareLocation: string;
  shareLocationSub: string;
  privacyPolicy: string;
  termsOfUse: string;
  languageRegion: string;
  language: string;
  citySafi: string;
  helpSupport: string;
  helpCenter: string;
  helpCenterSub: string;
  sendFeedback: string;
  sendFeedbackSub: string;
  rateApp: string;
  rateAppSub: string;
  appVersion: string;
  deleteAccount: string;
  deleteAccountSub: string;
  deleteAccountConfirm: string;
  deleteAccountMsg: string;
  logoutConfirmTitle: string;
  logoutConfirmMsg: string;
  logoutConfirmBtn: string;
  myOrders2: string;
  myAddresses: string;
  myPoints: string;
  editProfile: string;
  accountSection: string;
  changePassword: string;
}

export const AR: Translations = {
  home: 'الرئيسية', orders: 'طلباتي', cart: 'السلة', search: 'البحث', account: 'حسابي', newOrder: 'طلب جديد',
  add: 'إضافة', cancel: 'إلغاء', confirm: 'تأكيد', save: 'حفظ', edit: 'تعديل',
  delete: 'حذف', close: 'إغلاق', back: 'رجوع', seeAll: 'عرض الكل', loading: 'جارٍ التحميل...',
  error: 'خطأ', free: 'مجاني', minutes: 'د', retry: 'إعادة المحاولة',
  loadFailed: 'تعذر التحميل', delivery: 'توصيل',
  login: 'تسجيل الدخول', loginBtn: 'تسجيل الدخول', register: 'إنشاء حساب', registerBtn: 'إنشاء الحساب',
  logout: 'تسجيل الخروج', phone: 'رقم الهاتف', password: 'كلمة المرور',
  confirmPassword: 'تأكيد كلمة المرور', fullName: 'الاسم الكامل', city: 'المدينة',
  forgotPassword: 'نسيت كلمة المرور؟', noAccount: 'ليس لديك حساب؟', hasAccount: 'لديك حساب بالفعل؟',
  guestLogin: 'متابعة كضيف', guestLoginSub: 'تصفح التطبيق بدون تسجيل',
  continueAsGuest: 'المتابعة كضيف', welcomeTitle: 'مرحباً بك في جاهز',
  welcomeSub: 'مطاعم، بقالة، صيدلية وأكثر...\nنوصلك في أسرع وقت.',
  hello: 'مرحباً 👋', services: 'الخدمات', nearYou: 'قريب منك', quickServices: 'خدمات سريعة',
  promoTitle: 'توصيل مجاني\nلأول طلب!', promoSub: 'عرض خاص', orderNow: 'اطلب الآن',
  food: 'مطاعم', grocery: 'بقالة', pharmacy: 'صيدلية', parcel: 'طرود', errand: 'مهمة',
  fastDelivery: 'توصيل سريع', todayOffers: 'عروض اليوم', trackOrder: 'تتبع طلبك', support: 'الدعم',
  noStores: 'لا توجد متاجر متاحة حالياً', noStoresSub: 'ستظهر المتاجر هنا بعد إضافتها',
  searchPlaceholder: 'ابحث عن مطعم أو متجر أو خدمة...', searchTitle: 'ابحث في جاهز',
  recentSearches: 'بحث سابق', clearAll: 'مسح الكل', trending: 'الأكثر طلباً اليوم 🔥',
  featuredDishes: '⭐ أطباق مميزة', allStores: 'جميع المتاجر', noResults: 'لا توجد نتائج',
  noResultsSub: 'لم نجد شيئاً لـ', browseAll: 'تصفح الكل', restaurants: 'مطاعم', products: 'منتجات',
  stores: 'متاجر', discover: 'اكتشف',
  myOrders: 'طلباتي', ordersSub: 'تتبع وإدارة جميع طلباتك',
  activeOrder: 'الطلب النشط', noOrders: 'لا توجد طلبات', noOrdersSub: 'اطلب الآن!',
  orderStatus_pending: 'في الانتظار', orderStatus_confirmed: 'تم التأكيد', orderStatus_preparing: 'قيد التحضير',
  orderStatus_picked_up: 'في الطريق', orderStatus_delivered: 'تم التوصيل', orderStatus_cancelled: 'ملغي',
  reorder: 'إعادة الطلب', viewDetails: 'عرض التفاصيل', callDriver: 'اتصل بالسائق',
  trackDriver: 'تتبع السائق', eta: 'الوصول المتوقع', deliveredBy: 'سيصلك مع',
  filterAll: 'الكل', filterActive: 'جارية', filterCompleted: 'مكتملة', filterCancelled: 'ملغاة',
  activeNow: 'جارية الآن', stepConfirm: 'تأكيد', stepPrepare: 'تحضير', stepPickup: 'استلام', stepDeliver: 'توصيل',
  statTotal: 'إجمالي',
  favorites: 'المفضلة', paymentMethods: 'طرق الدفع',
  noFavoriteStores: 'لا توجد متاجر مفضلة', noFavoriteProducts: 'لا توجد منتجات مفضلة', freeDelivery: 'مجاني',
  removeFromFavorites: 'إزالة من المفضلة',
  notifMarkAllRead: 'تحديد الكل كمقروء', notifEmpty: 'لا توجد إشعارات', notifEmptySub: 'ستظهر هنا تحديثات طلباتك وإعلانات المنصة',
  notifTypeBroadcast: 'إعلان', notifTypeOrder: 'طلب', notifTypeSystem: 'نظام',
  settings: 'الإعدادات', notifications: 'الإشعارات', pushNotifications: 'الإشعارات الفورية',
  pushNotificationsSub: 'تحديثات الطلبات والعروض', orderUpdates: 'تحديثات الطلب',
  orderUpdatesSub: 'حالة الطلب وموقع السائق', promoNotifications: 'العروض والخصومات',
  promoNotificationsSub: 'عروض حصرية ورموز الخصم', locationPrivacy: 'الموقع والخصوصية',
  shareLocation: 'مشاركة الموقع', shareLocationSub: 'مطلوب للتوصيل الدقيق',
  privacyPolicy: 'سياسة الخصوصية', termsOfUse: 'شروط الاستخدام',
  languageRegion: 'اللغة والمنطقة', language: 'اللغة', citySafi: 'آسفي، المغرب',
  helpSupport: 'الدعم والمساعدة', helpCenter: 'مركز المساعدة', helpCenterSub: 'الأسئلة الشائعة',
  sendFeedback: 'إرسال ملاحظات', sendFeedbackSub: 'ساعدنا في التحسين',
  rateApp: 'قيّم التطبيق', rateAppSub: 'شاركنا رأيك في المتجر',
  appVersion: 'إصدار التطبيق', deleteAccount: 'حذف الحساب', deleteAccountSub: 'لا يمكن التراجع عن هذا',
  deleteAccountConfirm: 'حذف الحساب', deleteAccountMsg: 'هل أنت متأكد؟ سيتم حذف جميع بياناتك ولا يمكن التراجع.',
  logoutConfirmTitle: 'تسجيل الخروج', logoutConfirmMsg: 'هل تريد تسجيل الخروج من حسابك؟',
  logoutConfirmBtn: 'خروج', myOrders2: 'طلباتي', myAddresses: 'عناويني', myPoints: 'نقاطي',
  editProfile: 'تعديل الملف', accountSection: 'الحساب',
  changePassword: 'تغيير كلمة المرور',
};

const FR: Translations = {
  home: 'Accueil', orders: 'Commandes', cart: 'Panier', search: 'Recherche', account: 'Compte', newOrder: 'Commander',
  add: 'Ajouter', cancel: 'Annuler', confirm: 'Confirmer', save: 'Enregistrer', edit: 'Modifier',
  delete: 'Supprimer', close: 'Fermer', back: 'Retour', seeAll: 'Voir tout', loading: 'Chargement...',
  error: 'Erreur', free: 'Gratuit', minutes: 'min', retry: 'Réessayer',
  loadFailed: 'Chargement échoué', delivery: 'Livraison',
  login: 'Connexion', loginBtn: 'Se connecter', register: 'Créer un compte', registerBtn: 'Créer mon compte',
  logout: 'Déconnexion', phone: 'Numéro de téléphone', password: 'Mot de passe',
  confirmPassword: 'Confirmer le mot de passe', fullName: 'Nom complet', city: 'Ville',
  forgotPassword: 'Mot de passe oublié ?', noAccount: "Pas de compte ?", hasAccount: 'Déjà un compte ?',
  guestLogin: 'Accès invité', guestLoginSub: "Parcourir l’app sans compte",
  continueAsGuest: 'Continuer en invité', welcomeTitle: 'Bienvenue sur Jaheez',
  welcomeSub: 'Nourriture, épicerie, pharmacie et plus...\nLivré rapidement.',
  hello: 'Bonjour 👋', services: 'Services', nearYou: 'Près de vous', quickServices: 'Services rapides',
  promoTitle: 'Livraison gratuite\npour la 1ère commande !', promoSub: 'Offre spéciale', orderNow: 'Commander',
  food: 'Restaurants', grocery: 'Épicerie', pharmacy: 'Pharmacie', parcel: 'Colis', errand: 'Course',
  fastDelivery: 'Livraison rapide', todayOffers: "Offres du jour", trackOrder: 'Suivre', support: 'Support',
  noStores: 'Aucun magasin disponible', noStoresSub: 'Les magasins apparaîtront ici',
  searchPlaceholder: 'Chercher un plat, produit, magasin...', searchTitle: 'Rechercher',
  recentSearches: 'Recherches récentes', clearAll: 'Effacer', trending: 'Tendances du jour 🔥',
  featuredDishes: '⭐ Plats vedettes', allStores: 'Tous les magasins', noResults: 'Aucun résultat',
  noResultsSub: 'Rien trouvé pour', browseAll: 'Tout parcourir', restaurants: 'Restaurants',
  products: 'Produits', stores: 'Magasins', discover: 'Découvrir',
  myOrders: 'Mes commandes', ordersSub: 'Suivre et gérer vos commandes',
  activeOrder: 'Commande active', noOrders: 'Aucune commande', noOrdersSub: 'Commandez maintenant!',
  orderStatus_pending: 'En attente', orderStatus_confirmed: 'Confirmée', orderStatus_preparing: 'En préparation',
  orderStatus_picked_up: 'En route', orderStatus_delivered: 'Livrée', orderStatus_cancelled: 'Annulée',
  reorder: 'Recommander', viewDetails: 'Voir détails', callDriver: 'Appeler livreur',
  trackDriver: 'Suivre livreur', eta: 'Heure estimée', deliveredBy: 'Livré par',
  filterAll: 'Tout', filterActive: 'En cours', filterCompleted: 'Terminées', filterCancelled: 'Annulées',
  activeNow: 'En cours', stepConfirm: 'Confirmée', stepPrepare: 'Préparation', stepPickup: 'Récupérée', stepDeliver: 'Livraison',
  statTotal: 'Total',
  favorites: 'Favoris', paymentMethods: 'Paiement',
  noFavoriteStores: 'Aucun magasin favori', noFavoriteProducts: 'Aucun produit favori', freeDelivery: 'Gratuit',
  removeFromFavorites: 'Retirer des favoris',
  notifMarkAllRead: 'Tout marquer comme lu', notifEmpty: 'Aucune notification', notifEmptySub: 'Les mises à jour de vos commandes et annonces apparaîtront ici',
  notifTypeBroadcast: 'Annonce', notifTypeOrder: 'Commande', notifTypeSystem: 'Système',
  settings: 'Paramètres', notifications: 'Notifications', pushNotifications: 'Notifications push',
  pushNotificationsSub: 'Mises à jour commandes et offres', orderUpdates: 'Mises à jour de commande',
  orderUpdatesSub: 'Statut et position du livreur', promoNotifications: 'Offres et réductions',
  promoNotificationsSub: 'Offres exclusives et codes promo', locationPrivacy: 'Localisation & confidentialité',
  shareLocation: 'Partager la localisation', shareLocationSub: 'Requis pour une livraison précise',
  privacyPolicy: 'Politique de confidentialité', termsOfUse: "Conditions d’utilisation",
  languageRegion: 'Langue et région', language: 'Langue', citySafi: 'Safi, Maroc',
  helpSupport: 'Aide et support', helpCenter: "Centre d’aide", helpCenterSub: 'Questions fréquentes',
  sendFeedback: 'Envoyer un avis', sendFeedbackSub: 'Aidez-nous à nous améliorer',
  rateApp: "Évaluer l’app", rateAppSub: 'Partagez votre avis sur le store',
  appVersion: "Version de l’app", deleteAccount: 'Supprimer le compte', deleteAccountSub: 'Action irréversible',
  deleteAccountConfirm: 'Supprimer le compte', deleteAccountMsg: 'Êtes-vous sûr ? Toutes vos données seront supprimées.',
  logoutConfirmTitle: 'Déconnexion', logoutConfirmMsg: 'Voulez-vous vous déconnecter ?',
  logoutConfirmBtn: 'Déconnecter', myOrders2: 'Commandes', myAddresses: 'Adresses', myPoints: 'Points',
  editProfile: 'Modifier profil', accountSection: 'Compte',
  changePassword: 'Modifier le mot de passe',
};

const EN: Translations = {
  home: 'Home', orders: 'Orders', cart: 'Cart', search: 'Search', account: 'Account', newOrder: 'Order',
  add: 'Add', cancel: 'Cancel', confirm: 'Confirm', save: 'Save', edit: 'Edit',
  delete: 'Delete', close: 'Close', back: 'Back', seeAll: 'See all', loading: 'Loading...',
  error: 'Error', free: 'Free', minutes: 'min', retry: 'Try again',
  loadFailed: 'Failed to load', delivery: 'delivery',
  login: 'Login', loginBtn: 'Sign In', register: 'Create Account', registerBtn: 'Create Account',
  logout: 'Sign Out', phone: 'Phone number', password: 'Password',
  confirmPassword: 'Confirm password', fullName: 'Full name', city: 'City',
  forgotPassword: 'Forgot password?', noAccount: "Don't have an account?", hasAccount: 'Already have an account?',
  guestLogin: 'Guest access', guestLoginSub: 'Browse the app without signing in',
  continueAsGuest: 'Continue as guest', welcomeTitle: 'Welcome to Jaheez',
  welcomeSub: 'Food, grocery, pharmacy and more...\nDelivered fast.',
  hello: 'Hello 👋', services: 'Services', nearYou: 'Near You', quickServices: 'Quick Services',
  promoTitle: 'Free delivery\non your first order!', promoSub: 'Special offer', orderNow: 'Order Now',
  food: 'Food', grocery: 'Grocery', pharmacy: 'Pharmacy', parcel: 'Parcels', errand: 'Errand',
  fastDelivery: 'Fast Delivery', todayOffers: "Today's Offers", trackOrder: 'Track Order', support: 'Support',
  noStores: 'No stores available yet', noStoresSub: 'Stores will appear here once added',
  searchPlaceholder: 'Search for a dish, product, store...', searchTitle: 'Search Jaheez',
  recentSearches: 'Recent searches', clearAll: 'Clear all', trending: "Today's Trending 🔥",
  featuredDishes: '⭐ Featured Dishes', allStores: 'All Stores', noResults: 'No results',
  noResultsSub: 'Nothing found for', browseAll: 'Browse all', restaurants: 'Restaurants',
  products: 'Products', stores: 'Stores', discover: 'Discover',
  myOrders: 'My Orders', ordersSub: 'Track and manage all your orders',
  activeOrder: 'Active Order', noOrders: 'No orders yet', noOrdersSub: 'Order now!',
  orderStatus_pending: 'Pending', orderStatus_confirmed: 'Confirmed', orderStatus_preparing: 'Preparing',
  orderStatus_picked_up: 'On the way', orderStatus_delivered: 'Delivered', orderStatus_cancelled: 'Cancelled',
  reorder: 'Reorder', viewDetails: 'View details', callDriver: 'Call driver',
  trackDriver: 'Track driver', eta: 'Estimated arrival', deliveredBy: 'Delivered by',
  filterAll: 'All', filterActive: 'Active', filterCompleted: 'Completed', filterCancelled: 'Cancelled',
  activeNow: 'Active now', stepConfirm: 'Confirmed', stepPrepare: 'Preparing', stepPickup: 'Picked up', stepDeliver: 'Delivery',
  statTotal: 'Total',
  favorites: 'Favorites', paymentMethods: 'Payment',
  noFavoriteStores: 'No favorite stores', noFavoriteProducts: 'No favorite products', freeDelivery: 'Free',
  removeFromFavorites: 'Remove from favorites',
  notifMarkAllRead: 'Mark all as read', notifEmpty: 'No notifications', notifEmptySub: 'Your order updates and platform announcements will appear here',
  notifTypeBroadcast: 'Broadcast', notifTypeOrder: 'Order', notifTypeSystem: 'System',
  settings: 'Settings', notifications: 'Notifications', pushNotifications: 'Push Notifications',
  pushNotificationsSub: 'Order updates and promotions', orderUpdates: 'Order Updates',
  orderUpdatesSub: 'Order status and driver location', promoNotifications: 'Offers & Discounts',
  promoNotificationsSub: 'Exclusive offers and promo codes', locationPrivacy: 'Location & Privacy',
  shareLocation: 'Share Location', shareLocationSub: 'Required for accurate delivery',
  privacyPolicy: 'Privacy Policy', termsOfUse: 'Terms of Use',
  languageRegion: 'Language & Region', language: 'Language', citySafi: 'Safi, Morocco',
  helpSupport: 'Help & Support', helpCenter: 'Help Center', helpCenterSub: 'Frequently asked questions',
  sendFeedback: 'Send Feedback', sendFeedbackSub: 'Help us improve',
  rateApp: 'Rate the App', rateAppSub: 'Share your review on the store',
  appVersion: 'App Version', deleteAccount: 'Delete Account', deleteAccountSub: 'This cannot be undone',
  deleteAccountConfirm: 'Delete Account', deleteAccountMsg: 'Are you sure? All your data will be permanently deleted.',
  logoutConfirmTitle: 'Sign Out', logoutConfirmMsg: 'Are you sure you want to sign out?',
  logoutConfirmBtn: 'Sign Out', myOrders2: 'Orders', myAddresses: 'Addresses', myPoints: 'Points',
  editProfile: 'Edit Profile', accountSection: 'Account',
  changePassword: 'Change Password',
};

export const TRANSLATIONS: Record<Lang, Translations> = { ar: AR, fr: FR, en: EN };

export interface LangState {
  lang: Lang;
  isRTL: boolean;
  t: Translations;
  isTranslating: boolean;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: DEVICE_LANG,
      isRTL: DEVICE_LANG === 'ar',
      t: TRANSLATIONS[DEVICE_LANG],
      isTranslating: false,

      setLang: (lang) => {
        // 1. Apply hardcoded translations immediately — zero delay
        const hardcoded = TRANSLATIONS[lang];
        set({ lang, isRTL: lang === 'ar', t: hardcoded, isTranslating: false });
      },
    }),
    {
      name: 'jaheez-lang',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the lang code; translations are rebuilt on rehydration
      partialize: (s) => ({ lang: s.lang }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const lang = state.lang;
        // Apply hardcoded immediately
        state.t = TRANSLATIONS[lang];
        state.isRTL = lang === 'ar';
        state.isTranslating = false;
      },
    }
  )
);


