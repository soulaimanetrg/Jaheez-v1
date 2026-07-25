import {
  AlertCircle, ArrowLeft, ArrowLeftRight, ArrowRight, Award, Banknote, Bell,
  BellOff, Bike, BriefcaseBusiness, Calculator, CalendarDays, Camera, Check,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Circle,
  CircleHelp, CirclePlus, Clock3, CloudDownload, CloudOff, Copy,
  CreditCard, Eye, EyeOff, Flag, Flame, Gift, Globe, Grid2X2, Headphones,
  Heart, Home, Hourglass, Image, Info, KeyRound, Languages, LayoutGrid, List, LockKeyhole,
  LockOpen, LogOut, LucideIcon, LucideProps, Mail, MapPin, Megaphone, MessageCircle,
  MessagesSquare, Minus, Moon, Navigation, Package, PauseCircle, Pencil, Phone, Pill,
  Plus, ReceiptText, RefreshCw, Search, Send, Settings, Share2, ShieldCheck,
  ShoppingBag, ShoppingBasket, ShoppingCart, SlidersHorizontal, Smartphone, Sparkles, Star,
  Store, Tag, Timer, Trash2, TriangleAlert, User, UserPlus, Utensils, WalletCards,
  Wifi, X, Zap,
} from 'lucide-react-native';

export const APP_ICON_SIZE = 23;
export const APP_ICON_STROKE_WIDTH = 1.7;
export const APP_ICON_ACTIVE_STROKE_WIDTH = 2;

const icons: Record<string, LucideIcon> = {
  'arrow-back': ArrowLeft, 'arrow-back-outline': ArrowLeft,
  'arrow-forward': ArrowRight, 'arrow-forward-outline': ArrowRight,
  'chevron-back': ChevronLeft, 'chevron-forward': ChevronRight,
  'chevron-left': ChevronLeft, 'chevron-right': ChevronRight,
  'chevron-down': ChevronDown, 'chevron-up': ChevronUp,
  navigate: Navigation, 'navigate-outline': Navigation,
  'swap-horizontal-outline': ArrowLeftRight,
  add: Plus, 'add-circle-outline': CirclePlus, remove: Minus,
  close: X, 'close-circle': X, 'close-circle-outline': X,
  'store-closed': Moon,
  trash: Trash2, 'trash-outline': Trash2, 'create-outline': Pencil,
  refresh: RefreshCw, 'refresh-outline': RefreshCw, 'refresh-circle-outline': RefreshCw,
  'options-outline': SlidersHorizontal, copy: Copy, 'copy-outline': Copy,
  'share-social-outline': Share2, sparkles: Sparkles, 'flag-outline': Flag,
  checkmark: Check, 'checkmark-outline': Check, 'checkmark-done': Check,
  'checkmark-done-outline': Check, 'checkmark-circle': CheckCircle2,
  'checkmark-circle-outline': CheckCircle2, 'checkmark-circle-fill': CheckCircle2,
  search: Search, 'search-outline': Search, heart: Heart, 'heart-outline': Heart,
  'heart-dislike-outline': Heart, star: Star, 'star-outline': Star,
  bell: Bell, 'bell-outline': Bell, 'bell-slash': BellOff,
  'notifications-outline': Bell, 'notifications-off-outline': BellOff,
  location: MapPin, 'location-outline': MapPin,
  'lock-closed': LockKeyhole, 'lock-closed-outline': LockKeyhole,
  'lock-open-outline': LockOpen, 'key-outline': KeyRound, 'mail-outline': Mail,
  'phone-portrait-outline': Smartphone, call: Phone, 'call-outline': Phone,
  camera: Camera, time: Clock3, 'time-outline': Clock3, clock: Clock3,
  'clock-outline': Clock3, 'timer-outline': Timer, calendar: CalendarDays,
  'calendar-outline': CalendarDays, eye: Eye, 'eye-outline': Eye,
  'eye-off': EyeOff, 'eye-off-outline': EyeOff,
  pricetag: Tag, 'pricetag-outline': Tag, home: Home, 'home-outline': Home,
  send: Send, 'send-outline': Send, 'chatbubble-ellipses': MessageCircle,
  'chatbubble-ellipses-outline': MessageCircle, chatbubbles: MessagesSquare,
  'chatbubbles-outline': MessagesSquare, chatbubble: MessageCircle,
  'chatbubble-outline': MessageCircle, 'logo-whatsapp': MessageCircle,
  'megaphone-outline': Megaphone, 'bag-handle': ShoppingBag,
  'bag-handle-outline': ShoppingBag, 'bag-outline': ShoppingBag,
  bicycle: Bike, 'bicycle-outline': Bike, cart: ShoppingCart,
  'cart-outline': ShoppingCart, 'cash-outline': Banknote,
  'card-outline': CreditCard, wallet: WalletCards, 'wallet-outline': WalletCards,
  receipt: ReceiptText, 'receipt-outline': ReceiptText, list: List,
  'list-outline': List, storefront: Store, 'storefront-outline': Store,
  apps: Grid2X2, 'apps-outline': LayoutGrid,
  'basket-outline': ShoppingBasket, 'medkit-outline': Pill,
  'cube-outline': Package, 'clipboard-outline': List,
  restaurant: Utensils, 'restaurant-outline': Utensils,
  'fast-food-outline': Utensils, 'alert-circle': AlertCircle,
  'alert-circle-outline': AlertCircle, warning: TriangleAlert,
  'warning-outline': TriangleAlert, info: Info, 'information-circle': Info,
  'information-circle-outline': Info, 'help-circle': CircleHelp,
  'help-circle-outline': CircleHelp, 'shield-checkmark': ShieldCheck,
  'shield-checkmark-outline': ShieldCheck, 'cloud-download': CloudDownload,
  'cloud-download-outline': CloudDownload, 'cloud-offline-outline': CloudOff,
  'wifi-outline': Wifi, person: User, 'person-outline': User,
  'person-circle': User, 'person-circle-outline': User,
  'person-add-outline': UserPlus, 'log-out-outline': LogOut,
  'ribbon-outline': Award, globe: Globe, 'globe-outline': Globe,
  'language-outline': Languages, flame: Flame, flash: Zap, 'flash-outline': Zap,
  headset: Headphones, 'headset-outline': Headphones,
  'calculator-outline': Calculator, hourglass: Hourglass,
  'hourglass-outline': Hourglass, gift: Gift, image: Image,
  'pause-circle': PauseCircle, 'pause-circle-outline': PauseCircle,
  'settings-outline': Settings, 'briefcase-outline': BriefcaseBusiness,
  package: Package,
};

export interface AppIconProps extends Omit<LucideProps, 'size' | 'strokeWidth'> {
  name?: string;
  icon?: LucideIcon;
  size?: number;
  active?: boolean;
  filled?: boolean;
}

export function AppIcon({
  name,
  icon,
  size = APP_ICON_SIZE,
  active = false,
  filled = false,
  color,
  fill,
  ...props
}: AppIconProps) {
  const Icon = icon ?? (name ? icons[name] : undefined) ?? Circle;
  const isSolidHeart = name === 'heart';
  const isHeart = isSolidHeart || name === 'heart-outline';
  const shouldFill = filled || active || isSolidHeart || (isHeart && active);
  const iconColor = color ?? (shouldFill ? '#F03030' : '#5C5C5E');
  const resolvedFill = fill ?? (shouldFill ? iconColor : 'none');

  return (
    <Icon
      {...props}
      size={size}
      color={iconColor}
      fill={resolvedFill}
      strokeWidth={active ? APP_ICON_ACTIVE_STROKE_WIDTH : APP_ICON_STROKE_WIDTH}
      absoluteStrokeWidth
    />
  );
}
