import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { BRAND, FONTS, SHADOW_SM, SHADOW_RED } from '../../constants/brand';
import { useAuthStore } from '../../store/authStore';
import { useLangStore } from '../../store/languageStore';
import { dirRow, dirText } from '../../lib/direction';
import { createErrandDraft, ErrandDraftInput, ErrandItemCategory, ErrandQuote, ErrandServiceType, getErrandAvailability, getErrandQuote, listErrandAddresses, quoteErrand, SavedAddress, submitErrand } from '../../lib/errandApi';
import { generateSecureUUID } from '@/lib/uuid';

type ScreenState = 'form' | 'loading' | 'review' | 'success' | 'error';

const SERVICES: Array<{ id: ErrandServiceType; icon: 'send-outline' | 'receipt-outline'; ar: string; fr: string; en: string; subAr: string; subFr: string; subEn: string }> = [
  { id: 'send_item', icon: 'send-outline', ar: 'أرسل شيئًا', fr: 'Envoyer un objet', en: 'Send something', subAr: 'وثائق، مفاتيح أو طرد صغير', subFr: 'Documents, clés ou petit colis', subEn: 'Documents, keys or a small parcel' },
  { id: 'pickup_existing_order', icon: 'receipt-outline', ar: 'استلم طلبي', fr: 'Récupérer ma commande', en: 'Pick up my order', subAr: 'طلبته ودفعت ثمنه مسبقًا', subFr: 'Commande déjà passée et payée', subEn: 'Already ordered and paid' },
];

const CATEGORIES: ErrandItemCategory[] = ['documents', 'keys', 'clothes', 'food_package', 'small_parcel', 'other'];

const CHIP_LABELS: Record<string, { ar: string; fr: string; en: string }> = {
  documents:    { ar: 'وثائق',       fr: 'Documents',        en: 'Documents' },
  keys:         { ar: 'مفاتيح',      fr: 'Clés',             en: 'Keys' },
  clothes:      { ar: 'ملابس',       fr: 'Vêtements',        en: 'Clothes' },
  food_package: { ar: 'طرد غذائي',   fr: 'Colis alimentaire', en: 'Food package' },
  small_parcel: { ar: 'طرد صغير',    fr: 'Petit colis',      en: 'Small parcel' },
  other:        { ar: 'أخرى',        fr: 'Autre',            en: 'Other' },
  small:        { ar: 'صغير',        fr: 'Petit',            en: 'Small' },
  medium:       { ar: 'متوسط',       fr: 'Moyen',            en: 'Medium' },
  large:        { ar: 'كبير',        fr: 'Grand',            en: 'Large' },
  under_2kg:    { ar: 'أقل من 2 كلغ', fr: 'Moins de 2 kg',    en: 'Under 2 kg' },
  '2_to_5kg':   { ar: '2 – 5 كلغ',   fr: '2 – 5 kg',         en: '2 – 5 kg' },
  '5_to_9kg':   { ar: '5 – 9 كلغ',   fr: '5 – 9 kg',         en: '5 – 9 kg' },
};

function chipLabel(value: string, lang: string): string {
  const entry = CHIP_LABELS[value];
  if (!entry) return value.replaceAll('_', ' ');
  return lang === 'ar' ? entry.ar : lang === 'en' ? entry.en : entry.fr;
}

function makeKey() {
  return `errand:${generateSecureUUID()}`;
}

export default function GuidedErrandScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { lang, isRTL } = useLangStore();
  const user = useAuthStore(s => s.user);

  const [state, setState] = useState<ScreenState>('form');
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadAddresses, setLoadAddresses] = useState(true);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [service, setService] = useState<ErrandServiceType>('send_item');
  const [pickup, setPickup] = useState<SavedAddress | null>(null);
  const [dropoff, setDropoff] = useState<SavedAddress | null>(null);
  const [category, setCategory] = useState<ErrandItemCategory>('documents');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('small');
  const [weight, setWeight] = useState<'under_2kg' | '2_to_5kg' | '5_to_9kg'>('under_2kg');
  const [value, setValue] = useState('');
  const [pickupName, setPickupName] = useState(user?.full_name || '');
  const [pickupPhone, setPickupPhone] = useState(user?.phone || '');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [instructions, setInstructions] = useState('');
  const [safe, setSafe] = useState(false);
  const [quote, setQuote] = useState<ErrandQuote | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const key = useRef<string | null>(null);

  const text = useMemo(() => ({
    title: lang === 'ar' ? 'المهام والتوصيل' : lang === 'en' ? 'Courses & Errands' : 'Courses & services',
    subtitle: lang === 'ar' ? 'اختر خدمة واضحة وآمنة' : lang === 'en' ? 'Choose a clear, safe service' : 'Choisissez un service clair et sûr',
    addresses: lang === 'ar' ? 'الاستلام والتوصيل' : 'Adresses',
    contacts: lang === 'ar' ? 'جهات التواصل' : 'Contacts',
    details: lang === 'ar' ? 'تفاصيل الشيء' : 'Détails',
    continue: lang === 'ar' ? 'عرض السعر' : 'Voir le prix',
    confirm: lang === 'ar' ? 'إرسال للمراجعة' : 'Envoyer pour validation',
    safety: lang === 'ar' ? 'أؤكد أن الطلب قانوني وآمن وغير محظور ولا تتجاوز قيمته 500 درهم.' : 'Je confirme que la demande est légale, sûre, autorisée et vaut au maximum 500 DH.',
    emptyAddress: lang === 'ar' ? 'أضف عنوانًا محفوظًا مع الموقع أولًا' : 'Ajoutez d’abord une adresse avec sa position.',
    review: lang === 'ar' ? 'مراجعة الطلب' : 'Vérifier la demande',
    success: lang === 'ar' ? 'تم إرسال طلبك للمراجعة' : 'Demande envoyée pour validation',
    manual: lang === 'ar' ? 'المسافة تتطلب تسعيرًا يدويًا من العمليات.' : 'La distance exige un tarif manuel par les opérations.',
  }), [lang]);

  const label = (s: { ar: string; fr: string; en: string }) => lang === 'ar' ? s.ar : lang === 'en' ? s.en : s.fr;

  useEffect(() => {
    listErrandAddresses().then(rows => {
      const valid = rows.filter(a => a.lat !== null && a.lng !== null);
      setAddresses(valid);
      const def = valid.find(a => a.is_default) || valid[0] || null;
      setPickup(def);
      setDropoff(valid.find(a => a.id !== def?.id) || def);
    }).catch(() => setError(text.emptyAddress)).finally(() => setLoadAddresses(false));
  }, [text.emptyAddress]);

  useEffect(() => {
    getErrandAvailability().then(result => setAvailable(result.enabled)).catch(() => setAvailable(false));
  }, []);

  useEffect(() => {
    if (!draftId || !quote?.requires_manual_price) return;
    const timer = setInterval(() => {
      getErrandQuote(draftId, quote.id).then(setQuote).catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [draftId, quote?.id, quote?.requires_manual_price]);

  const buildInput = (): ErrandDraftInput => {
    if (!pickup || pickup.lat === null || pickup.lng === null || !dropoff || dropoff.lat === null || dropoff.lng === null) throw new Error(text.emptyAddress);
    if (!pickupName.trim() || !pickupPhone.trim() || !recipientName.trim() || !recipientPhone.trim()) throw new Error(lang === 'ar' ? 'بيانات التواصل مطلوبة' : 'Les contacts sont requis.');
    if (service === 'pickup_existing_order' && !orderCode.trim()) throw new Error(lang === 'ar' ? 'رمز الطلب مطلوب' : 'Le code de commande est requis.');
    if (!safe) throw new Error(lang === 'ar' ? 'يجب تأكيد شروط السلامة' : 'Confirmez les règles de sécurité.');
    return { service_type: service, pickup_address: pickup.address, pickup_lat: pickup.lat, pickup_lng: pickup.lng, dropoff_address: dropoff.address, dropoff_lat: dropoff.lat, dropoff_lng: dropoff.lng, pickup_contact_name: pickupName.trim(), pickup_contact_phone: pickupPhone.trim(), recipient_name: recipientName.trim(), recipient_phone: recipientPhone.trim(), item_category: category, item_size: size, weight_band: weight, declared_value_dh: Number(value || 0), existing_order_code: service === 'pickup_existing_order' ? orderCode.trim() : null, existing_order_paid: service === 'pickup_existing_order' ? true : null, instructions: instructions.trim() || null, scheduled_for: null, safety_confirmed: true };
  };

  const requestQuote = async () => {
    setError('');
    setState('loading');
    try {
      if (!key.current) key.current = makeKey();
      const draft = await createErrandDraft(buildInput(), key.current);
      const q = await quoteErrand(draft.id);
      setDraftId(draft.id);
      setQuote(q);
      setState('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
      setState('error');
    }
  };

  const submit = async () => {
    if (!draftId || !quote) return;
    setState('loading');
    try {
      const result = await submitErrand(draftId, quote.id);
      setOrderId(result.order_id);
      setState('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
      setState('error');
    }
  };

  if (available === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BRAND.RED} />
      </View>
    );
  }

  if (available === false) {
    return (
      <View style={styles.center}>
        <View style={styles.stateIcon}>
          <AppIcon name="lock-closed-outline" size={30} color={BRAND.TEXT3} />
        </View>
        <Text style={styles.successTitle}>{lang === 'ar' ? 'الخدمة غير متاحة حاليًا' : 'Service temporairement indisponible'}</Text>
        <Text style={styles.muted}>{lang === 'ar' ? 'سيتم تفعيلها بعد إتمام اختبارات الأمان.' : 'Elle sera activée après validation complète de la sécurité.'}</Text>
        <Pressable style={styles.primary} onPress={() => router.replace('/(tabs)')} accessibilityRole="button">
          <Text style={styles.primaryText}>{lang === 'ar' ? 'العودة' : 'Retour'}</Text>
        </Pressable>
      </View>
    );
  }

  if (state === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BRAND.RED} />
        <Text style={styles.muted}>{lang === 'ar' ? 'جاري التحقق من الطلب...' : 'Validation en cours...'}</Text>
      </View>
    );
  }

  if (state === 'success') {
    return (
      <View style={styles.center}>
        <View style={styles.successIcon}>
          <AppIcon name="checkmark" size={36} color={BRAND.SURFACE} />
        </View>
        <Text style={styles.successTitle}>{text.success}</Text>
        <View style={styles.orderPill}>
          <Text style={styles.orderPillText}>#{orderId?.slice(-8)}</Text>
        </View>
        <Pressable style={styles.primary} onPress={() => router.replace('/(tabs)/orders')} accessibilityRole="button" accessibilityLabel={text.success}>
          <Text style={styles.primaryText}>{lang === 'ar' ? 'طلباتي' : 'Mes commandes'}</Text>
        </Pressable>
      </View>
    );
  }

  if (state === 'review' && quote) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Header title={text.review} onBack={() => setState('form')} isRTL={isRTL} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.reviewCard}>
            <ReviewRow icon="navigate-outline" label={lang === 'ar' ? 'الاستلام' : 'Départ'} value={pickup?.address || ''} isRTL={isRTL} />
            <ReviewRow icon="location-outline" label={lang === 'ar' ? 'التوصيل' : 'Destination'} value={dropoff?.address || ''} isRTL={isRTL} />
            <ReviewRow icon="swap-horizontal-outline" label={lang === 'ar' ? 'المسافة' : 'Distance'} value={`${quote.distance_km.toFixed(1)} km`} isRTL={isRTL} />
            {quote.requires_manual_price ? (
              <Text style={styles.warning}>{text.manual}</Text>
            ) : (
              <>
                <ReviewRow icon="bicycle-outline" label={lang === 'ar' ? 'التوصيل' : 'Livraison'} value={`${quote.delivery_fee_dh.toFixed(2)} DH`} isRTL={isRTL} />
                <View style={[styles.totalRow, { flexDirection: dirRow(isRTL) }]}>
                  <Text style={styles.totalLabel}>{lang === 'ar' ? 'المجموع' : 'Total'}</Text>
                  <Text style={styles.totalValue}>{`${quote.total_dh.toFixed(2)} DH`}</Text>
                </View>
              </>
            )}
            <Text style={styles.expiry}>{lang === 'ar' ? 'السعر مؤقت ويُتحقق منه في الخادم' : 'Devis temporaire vérifié par le serveur'}</Text>
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            style={[styles.primary, quote.requires_manual_price && styles.disabled]}
            onPress={submit}
            disabled={quote.requires_manual_price}
            accessibilityRole="button"
            accessibilityLabel={text.confirm}
          >
            <Text style={styles.primaryText}>{text.confirm}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header title={text.title} onBack={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} isRTL={isRTL} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { textAlign: dirText(isRTL) }]}>{text.subtitle}</Text>

        <View style={styles.serviceGrid}>
          {SERVICES.map(item => {
            const active = service === item.id;
            return (
              <Pressable
                key={item.id}
                style={[styles.serviceCard, active && styles.serviceSelected]}
                onPress={() => setService(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={label(item)}
              >
                <View style={[styles.serviceTopRow, { flexDirection: dirRow(isRTL) }]}>
                  <View style={[styles.serviceIcon, active && styles.serviceIconSelected]}>
                    <AppIcon name={item.icon} size={22} color={active ? BRAND.SURFACE : BRAND.RED} active={active} />
                  </View>
                  <View style={[styles.radio, active && styles.radioOn]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                </View>
                <Text style={[styles.serviceTitle, { textAlign: dirText(isRTL) }]}>{label(item)}</Text>
                <Text style={[styles.serviceSub, { textAlign: dirText(isRTL) }]}>{lang === 'ar' ? item.subAr : lang === 'en' ? item.subEn : item.subFr}</Text>
              </Pressable>
            );
          })}
        </View>

        <Section title={text.addresses} isRTL={isRTL} />
        {loadAddresses ? (
          <ActivityIndicator color={BRAND.RED} />
        ) : addresses.length === 0 ? (
          <Pressable style={styles.empty} onPress={() => router.push('/(flows)/addresses')} accessibilityRole="button" accessibilityLabel={text.emptyAddress}>
            <AppIcon name="add-circle-outline" size={20} color={BRAND.RED} />
            <Text style={styles.emptyText}>{text.emptyAddress}</Text>
          </Pressable>
        ) : (
          <>
            <AddressPicker title={lang === 'ar' ? 'عنوان الاستلام' : 'Adresse de départ'} addresses={addresses} selected={pickup} onSelect={setPickup} isRTL={isRTL} />
            <AddressPicker title={lang === 'ar' ? 'عنوان التوصيل' : 'Adresse de livraison'} addresses={addresses} selected={dropoff} onSelect={setDropoff} isRTL={isRTL} />
          </>
        )}

        <Section title={text.contacts} isRTL={isRTL} />
        <View style={styles.fieldGroup}>
          <Field label={lang === 'ar' ? 'اسم جهة الاستلام' : 'Contact au départ'} value={pickupName} onChange={setPickupName} isRTL={isRTL} />
          <Field label={lang === 'ar' ? 'هاتف جهة الاستلام' : 'Téléphone au départ'} value={pickupPhone} onChange={setPickupPhone} keyboard="phone-pad" isRTL={isRTL} />
          <Field label={lang === 'ar' ? 'اسم المستلم' : 'Nom du destinataire'} value={recipientName} onChange={setRecipientName} isRTL={isRTL} />
          <Field label={lang === 'ar' ? 'هاتف المستلم' : 'Téléphone du destinataire'} value={recipientPhone} onChange={setRecipientPhone} keyboard="phone-pad" isRTL={isRTL} />
          {service === 'pickup_existing_order' && (
            <Field label={lang === 'ar' ? 'رمز الطلب المدفوع' : 'Code de la commande payée'} value={orderCode} onChange={setOrderCode} isRTL={isRTL} />
          )}
        </View>

        <Section title={text.details} isRTL={isRTL} />
        <ChipRow values={CATEGORIES} selected={category} onSelect={v => setCategory(v as ErrandItemCategory)} lang={lang} isRTL={isRTL} />
        <ChipRow values={['small', 'medium', 'large']} selected={size} onSelect={v => setSize(v as typeof size)} lang={lang} isRTL={isRTL} />
        <ChipRow values={['under_2kg', '2_to_5kg', '5_to_9kg']} selected={weight} onSelect={v => setWeight(v as typeof weight)} lang={lang} isRTL={isRTL} />
        <View style={styles.fieldGroup}>
          <Field label={lang === 'ar' ? 'القيمة المعلنة بالدرهم (حد أقصى 500)' : 'Valeur déclarée en DH (max 500)'} value={value} onChange={setValue} keyboard="decimal-pad" isRTL={isRTL} />
          <Field label={lang === 'ar' ? 'تعليمات اختيارية' : 'Instructions facultatives'} value={instructions} onChange={setInstructions} multiline isRTL={isRTL} />
        </View>

        <Pressable
          style={[styles.safety, { flexDirection: dirRow(isRTL) }]}
          onPress={() => setSafe(v => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: safe }}
          accessibilityLabel={text.safety}
        >
          <View style={[styles.checkbox, safe && styles.checkboxOn]}>
            {safe && <AppIcon name="checkmark" size={14} color={BRAND.SURFACE} />}
          </View>
          <Text style={[styles.safetyText, { textAlign: dirText(isRTL) }]}>{text.safety}</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.primary} onPress={requestQuote} accessibilityRole="button" accessibilityLabel={text.continue}>
          <Text style={styles.primaryText}>{text.continue}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Header({ title, onBack, isRTL }: { title: string; onBack: () => void; isRTL: boolean }) {
  return (
    <View style={[styles.header, { flexDirection: dirRow(isRTL) }]}>
      <Pressable style={styles.back} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
        <AppIcon name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={BRAND.TEXT} />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.back} />
    </View>
  );
}

function Section({ title, isRTL }: { title: string; isRTL: boolean }) {
  return <Text style={[styles.section, { textAlign: dirText(isRTL) }]}>{title}</Text>;
}

function Field({ label, value, onChange, keyboard = 'default', multiline = false, isRTL }: { label: string; value: string; onChange: (v: string) => void; keyboard?: 'default' | 'phone-pad' | 'decimal-pad'; multiline?: boolean; isRTL: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { textAlign: dirText(isRTL) }]}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        multiline={multiline}
        textAlign={isRTL ? 'right' : 'left'}
        placeholderTextColor={BRAND.TEXT3}
        accessibilityLabel={label}
      />
    </View>
  );
}

function AddressPicker({ title, addresses, selected, onSelect, isRTL }: { title: string; addresses: SavedAddress[]; selected: SavedAddress | null; onSelect: (a: SavedAddress) => void; isRTL: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { textAlign: dirText(isRTL) }]}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addressRow}>
        {addresses.map(a => {
          const active = selected?.id === a.id;
          return (
            <Pressable
              key={a.id}
              style={[styles.addressChip, active && styles.addressSelected]}
              onPress={() => onSelect(a)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${title}: ${a.label}`}
            >
              <View style={[styles.addressHead, { flexDirection: dirRow(isRTL) }]}>
                <AppIcon name={active ? 'location' : 'location-outline'} size={14} color={active ? BRAND.RED : BRAND.TEXT3} active={active} />
                <Text style={[styles.addressLabel, active && styles.addressLabelSelected]} numberOfLines={1}>{a.label}</Text>
              </View>
              <Text style={[styles.addressText, { textAlign: dirText(isRTL) }]} numberOfLines={1}>{a.address}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ChipRow({ values, selected, onSelect, lang, isRTL }: { values: string[]; selected: string; onSelect: (v: string) => void; lang: string; isRTL: boolean }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { flexDirection: dirRow(isRTL) }]}>
      {values.map(v => {
        const active = selected === v;
        return (
          <Pressable
            key={v}
            style={[styles.chip, active && styles.chipSelected]}
            onPress={() => onSelect(v)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={chipLabel(v, lang)}
          >
            <Text style={[styles.chipText, active && styles.chipTextSelected]}>{chipLabel(v, lang)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ReviewRow({ icon, label, value, isRTL }: { icon: React.ComponentProps<typeof AppIcon>['name']; label: string; value: string; isRTL: boolean }) {
  return (
    <View style={[styles.reviewRow, { flexDirection: dirRow(isRTL) }]}>
      <View style={styles.reviewIcon}>
        <AppIcon name={icon} size={15} color={BRAND.TEXT3} />
      </View>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={[styles.reviewValue, { textAlign: isRTL ? 'left' : 'right' }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.BG },
  scroll: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, backgroundColor: BRAND.BG },

  // ── Header
  header: {
    height: 58,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BRAND.BG,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BRAND.LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.DISPLAY,
    fontSize: 17,
    fontWeight: '700',
    color: BRAND.TEXT,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.BODY,
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.TEXT2,
    marginBottom: 18,
  },

  // ── Service cards
  serviceGrid: { gap: 12 },
  serviceCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BRAND.BORDER,
    backgroundColor: BRAND.SURFACE,
    ...SHADOW_SM,
  },
  serviceSelected: {
    borderColor: BRAND.RED,
    backgroundColor: BRAND.RED_LIGHT,
  },
  serviceTopRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: BRAND.RED_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconSelected: {
    backgroundColor: BRAND.RED,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: BRAND.INPUT_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: BRAND.RED },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: BRAND.RED,
  },
  serviceTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.TEXT,
  },
  serviceSub: {
    fontFamily: FONTS.BODY,
    fontSize: 12.5,
    lineHeight: 17,
    color: BRAND.TEXT2,
    marginTop: 3,
  },

  // ── Sections & fields
  section: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 17,
    fontWeight: '700',
    color: BRAND.TEXT,
    marginTop: 28,
    marginBottom: 12,
  },
  fieldGroup: { gap: 2 },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.TEXT2,
    marginBottom: 7,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: BRAND.LIGHT,
    fontFamily: FONTS.BODY,
    fontSize: 14,
    color: BRAND.TEXT,
  },
  multiline: {
    height: 96,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  // ── Address chips
  addressRow: { gap: 10 },
  addressChip: {
    width: 190,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BRAND.BORDER,
    backgroundColor: BRAND.SURFACE,
  },
  addressSelected: {
    borderColor: BRAND.RED,
    backgroundColor: BRAND.RED_LIGHT,
  },
  addressHead: {
    alignItems: 'center',
    gap: 5,
  },
  addressLabel: {
    flex: 1,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.TEXT,
  },
  addressLabelSelected: { color: BRAND.RED_DARK },
  addressText: {
    fontFamily: FONTS.BODY,
    fontSize: 11.5,
    color: BRAND.TEXT3,
    marginTop: 5,
  },

  // ── Chips
  chips: { gap: 8, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: BRAND.LIGHT,
  },
  chipSelected: { backgroundColor: BRAND.RED },
  chipText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12.5,
    color: BRAND.TEXT2,
  },
  chipTextSelected: { color: BRAND.SURFACE },

  // ── Safety
  safety: {
    padding: 15,
    borderRadius: 16,
    backgroundColor: BRAND.CREAM,
    borderWidth: 1,
    borderColor: BRAND.BORDER,
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: BRAND.INPUT_BORDER,
    backgroundColor: BRAND.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: BRAND.RED,
    borderColor: BRAND.RED,
  },
  safetyText: {
    flex: 1,
    fontFamily: FONTS.BODY,
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.TEXT2,
  },

  // ── Buttons & states
  primary: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    ...SHADOW_RED,
  },
  primaryText: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 15.5,
    fontWeight: '700',
    color: BRAND.SURFACE,
  },
  disabled: { opacity: 0.45 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: BRAND.BG,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
    backgroundColor: BRAND.LIGHT,
  },
  emptyText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.TEXT2,
  },
  warning: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.WARN,
    textAlign: 'center',
    marginTop: 12,
  },
  error: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.ERROR,
    textAlign: 'center',
    marginTop: 10,
  },
  muted: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: BRAND.TEXT2,
    textAlign: 'center',
  },

  // ── Review
  reviewCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: BRAND.SURFACE,
    borderWidth: 1,
    borderColor: BRAND.BORDER,
    ...SHADOW_SM,
  },
  reviewRow: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.LIGHT,
  },
  reviewIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: BRAND.LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewLabel: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: BRAND.TEXT3,
  },
  reviewValue: {
    flex: 1,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.TEXT,
  },
  totalRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 2,
  },
  totalLabel: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.TEXT,
  },
  totalValue: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 20,
    fontWeight: '800',
    color: BRAND.RED,
  },
  expiry: {
    fontFamily: FONTS.BODY,
    fontSize: 11,
    color: BRAND.TEXT3,
    textAlign: 'center',
    marginTop: 14,
  },

  // ── Success / state screens
  stateIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BRAND.LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: BRAND.GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 21,
    fontWeight: '700',
    color: BRAND.TEXT,
    textAlign: 'center',
  },
  orderPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: BRAND.LIGHT,
  },
  orderPillText: {
    fontFamily: FONTS.MONO,
    fontSize: 13,
    color: BRAND.TEXT2,
  },
});
