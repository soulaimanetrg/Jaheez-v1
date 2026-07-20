// Driver-app i18n (FR primary, AR fallback). Plain object — no remote translations.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Lang = 'fr' | 'ar' | 'en';

export interface T {
  // Common
  loading: string; error: string; cancel: string; confirm: string; save: string;
  retry: string; back: string; next: string; ok: string; loadFailed: string;

  // Auth
  welcomeTitle: string; welcomeSub: string; getStarted: string; haveAccount: string;
  loginTitle: string; loginSub: string; phone: string; sendOtp: string;
  otpTitle: string; otpSub: string; resend: string; verify: string;
  fullName: string; vehicleType: string;
  motorcycle: string; bicycle: string; car: string; createAccount: string;
  cinLabel: string; passwordLabel: string; loginButton: string; goToLogin: string; regAdminOnly: string;
  changePassword: string;

  // Dashboard
  dashboard: string; goOnline: string; goOffline: string; online: string; offline: string;
  available: string; mine: string; history: string;
  noOrders: string; noOrdersSub: string; claim: string;
  pickup: string; dropoff: string; cash: string; card: string;
  earningsToday: string; jobsToday: string;

  // Active delivery
  activeDelivery: string;
  stage_heading: string; stage_arrived_pickup: string; stage_picked_up: string;
  stage_arrived_customer: string; stage_delivered: string;
  callCustomer: string; openMap: string; markComplete: string;

  // Earnings
  earnings: string; balance: string; codBalance: string; codHelp: string;
  payoutHistory: string;

  // Payout
  amount: string; rib: string; bankName: string; ribHolder: string;

  // Profile
  profile: string; kyc: string; vehicleInfo: string; bankInfo: string;
  documents: string; cinFront: string; cinBack: string; selfie: string;
  permis: string; carteGrise: string; assurance: string;
  uploadDoc: string; pending: string; approved: string; rejected: string;
  logout: string; logoutConfirm: string;

  // KYC banners
  kycPendingTitle: string; kycPendingSub: string;
  kycPartialTitle: string; kycPartialSub: string;
  kycFullTitle: string; kycRejectedTitle: string;
  jobsLeft: string;
}

export const FR: T = {
  loading: 'Chargement...', error: 'Erreur', cancel: 'Annuler', confirm: 'Confirmer', save: 'Enregistrer',
  retry: 'Réessayer', back: 'Retour', next: 'Suivant', ok: 'OK', loadFailed: 'Échec du chargement',

  welcomeTitle: 'Bienvenue chez JAHEEZ', welcomeSub: 'Roulez quand vous voulez. Encaissez chaque jour.',
  getStarted: 'Se connecter', haveAccount: 'Se connecter',
  loginTitle: 'Connexion livreur', loginSub: "Entrez vos identifiants fournis par l'administration",
  phone: 'Numéro de téléphone', sendOtp: 'Se connecter',
  otpTitle: 'Code de vérification', otpSub: 'Entrez le code reçu par SMS',
  cinLabel: 'CIN / Identifiant', passwordLabel: 'Mot de passe', loginButton: 'Se connecter',
  goToLogin: 'Aller à la connexion', regAdminOnly: "L'inscription des livreurs est gérée par l'administration.",
  changePassword: 'Modifier le mot de passe',
  resend: 'Renvoyer le code', verify: 'Vérifier',
  fullName: 'Nom complet', vehicleType: 'Type de véhicule',
  motorcycle: 'Moto', bicycle: 'Vélo', car: 'Voiture', createAccount: 'Créer le compte',

  dashboard: 'Tableau de bord', goOnline: 'Se mettre en ligne', goOffline: 'Se déconnecter',
  online: 'En ligne', offline: 'Hors ligne',
  available: 'Disponibles', mine: 'En cours', history: 'Historique',
  noOrders: 'Aucune commande', noOrdersSub: 'Restez en ligne, ça va arriver.',
  claim: 'Prendre la course', pickup: 'Récupérer', dropoff: 'Livrer',
  cash: 'Espèces', card: 'Carte', earningsToday: 'Gains du jour', jobsToday: 'Courses du jour',

  activeDelivery: 'Livraison en cours',
  stage_heading: 'En route vers le point de retrait',
  stage_arrived_pickup: 'Arrivé au point de retrait',
  stage_picked_up: 'Colis récupéré',
  stage_arrived_customer: 'Arrivé chez le client',
  stage_delivered: 'Livré',
  callCustomer: 'Appeler le client', openMap: 'Ouvrir le plan', markComplete: 'Marquer terminé',

  earnings: 'Mes gains', balance: 'Solde disponible',
  codBalance: 'Espèces à reverser', codHelp: 'Passez à la fenêtre cash de Safi (18h–21h) pour régler.',
  payoutHistory: 'Historique des virements',

  amount: 'Montant (DH)',
  rib: 'RIB (24 chiffres)', bankName: 'Nom de la banque', ribHolder: 'Titulaire du compte',

  profile: 'Mon compte', kyc: 'Vérification KYC', vehicleInfo: 'Véhicule', bankInfo: 'Coordonnées bancaires',
  documents: 'Documents', cinFront: 'CIN — recto', cinBack: 'CIN — verso', selfie: 'Selfie',
  permis: 'Permis de conduire', carteGrise: 'Carte grise', assurance: 'Assurance',
  uploadDoc: 'Téléverser', pending: 'En attente', approved: 'Approuvé', rejected: 'Refusé',
  logout: 'Déconnexion', logoutConfirm: 'Voulez-vous vous déconnecter ?',

  kycPendingTitle: 'Téléchargez votre CIN + selfie pour démarrer',
  kycPendingSub: 'Vous pouvez prendre vos 3 premières courses dès la validation.',
  kycPartialTitle: 'Compte partiellement vérifié',
  kycPartialSub: 'Complétez votre dossier pour rouler sans limite.',
  kycFullTitle: 'Compte vérifié — bonne route !',
  kycRejectedTitle: 'KYC refusé — contactez le support',
  jobsLeft: 'courses restantes avant blocage',
};

export const AR: T = {
  loading: 'جارٍ التحميل...', error: 'خطأ', cancel: 'إلغاء', confirm: 'تأكيد', save: 'حفظ',
  retry: 'إعادة المحاولة', back: 'رجوع', next: 'التالي', ok: 'موافق', loadFailed: 'فشل التحميل',
  welcomeTitle: 'مرحباً بك في جاهز', welcomeSub: 'اشتغل وقت ما تحب. خود فلوسك كل يوم.',
  getStarted: 'تسجيل الدخول', haveAccount: 'تسجيل الدخول',
  loginTitle: 'تسجيل دخول السائق', loginSub: 'أدخل بيانات الدخول الخاصة بك',
  phone: 'رقم الهاتف', sendOtp: 'تسجيل الدخول',
  otpTitle: 'رمز التحقق', otpSub: 'أدخل الرمز المرسل في رسالة',
  cinLabel: 'رقم البطاقة الوطنية / المعرف', passwordLabel: 'كلمة المرور', loginButton: 'تسجيل الدخول',
  goToLogin: 'الذهاب لتسجيل الدخول', regAdminOnly: 'تسجيل السائقين يتم من طرف الإدارة.',
  changePassword: 'تغيير كلمة المرور',
  resend: 'إعادة الإرسال', verify: 'تحقق',
  fullName: 'الاسم الكامل', vehicleType: 'نوع المركبة',
  motorcycle: 'دراجة نارية', bicycle: 'دراجة', car: 'سيارة', createAccount: 'إنشاء',
  dashboard: 'الرئيسية', goOnline: 'الاتصال', goOffline: 'قطع الاتصال',
  online: 'متصل', offline: 'غير متصل',
  available: 'متاح', mine: 'الحالية', history: 'السجل',
  noOrders: 'لا طلبات', noOrdersSub: 'ابق متصل، ستصلك قريبا.',
  claim: 'قبول', pickup: 'استلام', dropoff: 'توصيل',
  cash: 'نقدا', card: 'بطاقة', earningsToday: 'أرباح اليوم', jobsToday: 'طلبات اليوم',
  activeDelivery: 'توصيل جاري',
  stage_heading: 'متجه للاستلام', stage_arrived_pickup: 'وصلت لنقطة الاستلام',
  stage_picked_up: 'استلمت الطلب', stage_arrived_customer: 'وصلت للعميل', stage_delivered: 'تم التوصيل',
  callCustomer: 'اتصل بالعميل', openMap: 'افتح الخريطة', markComplete: 'إنهاء',
  earnings: 'أرباحي', balance: 'الرصيد المتاح',
  codBalance: 'نقد للتسليم', codHelp: 'مر من نقطة الكاش بآسفي (18–21) لتسوية.',
  payoutHistory: 'سجل التحويلات',
  amount: 'المبلغ (DH)',
  rib: 'RIB (24 رقم)', bankName: 'اسم البنك', ribHolder: 'صاحب الحساب',
  profile: 'حسابي', kyc: 'التحقق', vehicleInfo: 'المركبة', bankInfo: 'البنك',
  documents: 'الوثائق', cinFront: 'CIN أمامي', cinBack: 'CIN خلفي', selfie: 'سيلفي',
  permis: 'رخصة السياقة', carteGrise: 'البطاقة الرمادية', assurance: 'التأمين',
  uploadDoc: 'تحميل', pending: 'في الانتظار', approved: 'موافق', rejected: 'مرفوض',
  logout: 'تسجيل خروج', logoutConfirm: 'تأكيد الخروج؟',
  kycPendingTitle: 'حمل CIN و سيلفي للبدء',
  kycPendingSub: 'يمكنك أخذ 3 طلبات بعد الموافقة.',
  kycPartialTitle: 'حساب جزئي', kycPartialSub: 'كمل ملفك لشغل بدون حد.',
  kycFullTitle: 'حساب موثق — طريق سعيدة!',
  kycRejectedTitle: 'KYC مرفوض — تواصل مع الدعم',
  jobsLeft: 'طلبات قبل الإيقاف',
};

export const EN: T = {
  loading: 'Loading...', error: 'Error', cancel: 'Cancel', confirm: 'Confirm', save: 'Save',
  retry: 'Retry', back: 'Back', next: 'Next', ok: 'OK', loadFailed: 'Failed to load',

  welcomeTitle: 'Welcome to JAHEEZ', welcomeSub: 'Drive when you want. Cash out every day.',
  getStarted: 'Sign In', haveAccount: 'Sign In',
  loginTitle: 'Driver Sign In', loginSub: 'Enter your credentials provided by the administration',
  phone: 'Phone number', sendOtp: 'Sign In',
  otpTitle: 'Verification Code', otpSub: 'Enter the code received by SMS',
  cinLabel: 'CIN / ID', passwordLabel: 'Password', loginButton: 'Sign In',
  goToLogin: 'Go to Login', regAdminOnly: 'Driver registration is managed by the administration.',
  changePassword: 'Change Password',
  resend: 'Resend code', verify: 'Verify',
  fullName: 'Full name', vehicleType: 'Vehicle type',
  motorcycle: 'Motorcycle', bicycle: 'Bicycle', car: 'Car', createAccount: 'Create Account',

  dashboard: 'Dashboard', goOnline: 'Go Online', goOffline: 'Go Offline',
  online: 'Online', offline: 'Offline',
  available: 'Available', mine: 'Active', history: 'History',
  noOrders: 'No orders', noOrdersSub: 'Stay online, orders will come.',
  claim: 'Accept delivery', pickup: 'Pickup', dropoff: 'Deliver',
  cash: 'Cash', card: 'Card', earningsToday: 'Earnings today', jobsToday: 'Jobs today',

  activeDelivery: 'Active Delivery',
  stage_heading: 'On the way to pickup',
  stage_arrived_pickup: 'Arrived at pickup',
  stage_picked_up: 'Package picked up',
  stage_arrived_customer: 'Arrived at customer',
  stage_delivered: 'Delivered',
  callCustomer: 'Call customer', openMap: 'Open map', markComplete: 'Mark complete',

  earnings: 'My Earnings', balance: 'Available balance',
  codBalance: 'Cash to return', codHelp: 'Go to Safi cash window (6pm–9pm) to settle.',
  payoutHistory: 'Transfer history',

  amount: 'Amount (DH)',
  rib: 'RIB (24 digits)', bankName: 'Bank name', ribHolder: 'Account holder',

  profile: 'My Profile', kyc: 'KYC Verification', vehicleInfo: 'Vehicle', bankInfo: 'Bank Details',
  documents: 'Documents', cinFront: 'CIN — front', cinBack: 'CIN — back', selfie: 'Selfie',
  permis: 'Driver License', carteGrise: 'Registration Document', assurance: 'Insurance',
  uploadDoc: 'Upload', pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
  logout: 'Sign Out', logoutConfirm: 'Are you sure you want to sign out?',

  kycPendingTitle: 'Upload your CIN + selfie to start',
  kycPendingSub: 'You can take your first 3 deliveries once validated.',
  kycPartialTitle: 'Account partially verified',
  kycPartialSub: 'Complete your file to ride without limits.',
  kycFullTitle: 'Verified account — safe travels!',
  kycRejectedTitle: 'KYC rejected — contact support',
  jobsLeft: 'deliveries left before lock',
};



export const useLangStore = create<{ lang: Lang; t: T; setLang: (l: Lang) => void }>()(
  persist(
    (set) => ({
      lang: 'fr',
      t: FR,
      setLang: (lang) => set({ lang, t: lang === 'fr' ? FR : lang === 'ar' ? AR : EN }),
    }),
    {
      name: 'jaheez-driver-lang',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ lang: s.lang }),
      onRehydrateStorage: () => (state) => {
        if (state) state.t = state.lang === 'fr' ? FR : state.lang === 'ar' ? AR : EN;
      },
    }
  )
);

