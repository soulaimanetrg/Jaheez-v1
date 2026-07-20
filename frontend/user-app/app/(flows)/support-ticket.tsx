import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { AppSearchBar } from '../../components/ui/AppSearchBar';
import { BRAND, FONTS } from '../../constants/brand';
import { useCreateSupportTicket } from '../../hooks/mutations/useSupportMutations';
import { useLangStore } from '../../store/languageStore';
import { useAppContent } from '../../hooks/queries/useContent';
import { dirRow, dirItems, dirText, backArrow } from '../../lib/direction';
import { usePlatformStore } from '../../features/stores/store/platformStore';

if (
  Platform.OS === 'android'
  && UIManager.setLayoutAnimationEnabledExperimental
  && !(globalThis as { RN$Fabric?: unknown }).RN$Fabric
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORIES = [
  { id: 'order',   icon: 'receipt-outline',        label: 'مشكلة في طلب',     color: BRAND.RED   },
  { id: 'payment', icon: 'card-outline',            label: 'مشكلة في الدفع',   color: BRAND.BLUE  },
  { id: 'account', icon: 'person-outline',          label: 'مشكلة في الحساب',  color: BRAND.WARN  },
  { id: 'driver',  icon: 'bicycle-outline',         label: 'شكوى على سائق',    color: '#8B5CF6'   },
  { id: 'app',     icon: 'phone-portrait-outline',  label: 'مشكلة تقنية',      color: BRAND.TEXT2 },
  { id: 'other',   icon: 'chatbubble-outline',      label: 'أخرى',             color: BRAND.GREEN },
];

const URGENCY = [
  { id: 'normal', label: 'عادي',  sub: 'رد خلال 24 ساعة', color: BRAND.GREEN },
  { id: 'high',   label: 'مهم',   sub: 'رد خلال 4 ساعات', color: BRAND.WARN  },
  { id: 'urgent', label: 'عاجل',  sub: 'رد فوري',          color: BRAND.RED   },
];

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '';
}


/* ── Accordion FAQ Item Component ── */
function AccordionFaqItem({ item, isOpen, onToggle, currentIsRTL }: { item: { q: string; a: string }; isOpen: boolean; onToggle: () => void; currentIsRTL: boolean }) {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  return (
    <View style={styles.faqWrapper}>
      <Pressable
        style={[styles.faqHeader, { flexDirection: currentIsRTL ? 'row' : 'row-reverse' }]}
        onPress={onToggle}
      >
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} color="#64748B" />
        <Text style={[styles.faqQuestion, { textAlign: currentIsRTL ? 'right' : 'left' }]}>{item.q}</Text>
      </Pressable>
      {isOpen && (
        <Animated.View style={[styles.faqAnswerContainer, { opacity: opacityAnim, flexDirection: currentIsRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.faqAnswerLine} />
          <Text style={[styles.faqAnswerTxt, { textAlign: currentIsRTL ? 'right' : 'left' }]}>{item.a}</Text>
        </Animated.View>
      )}
    </View>
  );
}

export default function SupportTicketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { lang, isRTL } = useLangStore();

  const [showTicketForm, setShowTicketForm] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedFaqKey, setExpandedFaqKey] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState<string | null>(null);
  const [urgency,  setUrgency]  = useState('normal');
  const [orderId,  setOrderId]  = useState('');
  const [subject,  setSubject]  = useState('');
  const [message,  setMessage]  = useState('');
  const [refNumber, setRefNumber] = useState('');

  const createTicket = useCreateSupportTicket();
  const submitting = createTicket.isPending;
  const submitted  = createTicket.isSuccess;

  const currentIsRTL = lang === 'ar';
  const rowChevron = isRTL ? 'chevron-back' : 'chevron-forward';

  const { data: faqItems = [], isLoading: isFaqLoading } = useAppContent('faq');
  const supportPhone = usePlatformStore(s => s.supportPhoneE164);

  // Localized texts
  const helpCenterText = currentIsRTL ? 'المساعدة والدعم' : (lang === 'fr' ? 'Aide et support' : 'Help & Support');
  const tagLineText = currentIsRTL ? 'كيف يمكننا مساعدتك؟' : (lang === 'fr' ? 'Comment pouvons-nous vous aider ?' : 'How can we help you?');
  const searchPlaceholder = currentIsRTL ? 'ابحث عن إجابة...' : (lang === 'fr' ? 'Rechercher une réponse...' : 'Search a response...');
  const quickContactText = currentIsRTL ? 'اتصال سريع' : (lang === 'fr' ? 'Contact rapide' : 'Quick Contact');
  const faqText = currentIsRTL ? 'الأسئلة الشائعة' : (lang === 'fr' ? 'FAQ' : 'FAQ');
  const sendRequestText = currentIsRTL ? 'إرسال طلب' : (lang === 'fr' ? 'Envoyer une demande' : 'Send a request');

  const canSubmit = !!category && subject.trim().length > 3 && message.trim().length > 10;

  const handleWhatsappPress = () => {
    if (!supportPhone) return router.push('/(tabs)/chat');
    Linking.openURL(`https://wa.me/${supportPhone.replace(/\D/g,'')}`).catch(() => {
      router.push('/(tabs)/chat');
    });
  };

  const handleCallPress = () => {
    if (!supportPhone) return router.push('/(tabs)/chat');
    Linking.openURL(`tel:${supportPhone}`).catch(() => router.push('/(tabs)/chat'));
  };

  const toggleCategory = (catId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveCategory(activeCategory === catId ? null : catId);
    setExpandedFaqKey(null);
  };

  const toggleFaq = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaqKey(expandedFaqKey === key ? null : key);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      const res = await createTicket.mutateAsync({
        category:  category!,
        urgency,
        subject:   subject.trim(),
        message:   message.trim(),
        order_id:  orderId.trim() || undefined,
      });
      if (res.data?.ref_number) setRefNumber(res.data.ref_number);
    } catch (error: unknown) {
      Alert.alert(
        lang === 'ar' ? 'خطأ' : 'Erreur',
        getErrorMessage(error) || (lang === 'ar' ? 'تعذر إرسال الطلب.' : 'Impossible d’envoyer la demande.'),
      );
    }
  };

  // Filter FAQs based on search string
  const filteredFaqItems = faqItems.filter(item => {
    const q = (currentIsRTL ? item.titleAr : item.titleFr) || '';
    const a = (currentIsRTL ? item.bodyAr : item.bodyFr) || '';
    return (
      q.toLowerCase().includes(search.toLowerCase()) ||
      a.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Handle back navigation on Aide et support
  const handleBack = () => {
    if (showTicketForm) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowTicketForm(false);
    } else {
      router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
    }
  };

  // If ticket is submitted
  if (submitted) {
    return (
      <View style={[styles.root, styles.successRoot]}>
        <View style={[styles.successBg, { paddingTop: insets.top }]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={BRAND.GREEN} />
          </View>
          <Text style={styles.successTitle}>
            {lang === 'ar' ? 'تم إرسال تذكرتك!' : 'Demande envoyée !'}
          </Text>
          <Text style={styles.successSub}>
            {lang === 'ar' 
              ? 'سيتواصل معك فريق الدعم في أقرب وقت ممكن عبر رقم هاتفك المسجّل.' 
              : 'Notre équipe d\'assistance vous contactera dès que possible sur votre numéro enregistré.'}
          </Text>
          {refNumber ? (
            <View style={styles.ticketRef}>
              <Text style={styles.ticketRefLabel}>
                {lang === 'ar' ? 'رقم التذكرة' : 'N° de ticket'}
              </Text>
              <Text style={styles.ticketRefVal}>{refNumber}</Text>
            </View>
          ) : null}
          <Pressable
            style={styles.backHomeBtn}
            onPress={() => router.replace('/(tabs)/profile')}
            accessibilityLabel="Back"
          >
            <Text style={styles.backHomeTxt}>
              {lang === 'ar' ? 'العودة لحسابي' : 'Retour à mon compte'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10, flexDirection: dirRow(isRTL) }]}>
        <Pressable style={styles.backBtn} onPress={handleBack}>
          <Ionicons name={backArrow(isRTL)} size={22} color="#1E293B" />
        </Pressable>
        <View style={{ width: 40 }} />
      </View>

      {!showTicketForm ? (
        /* ─── SCROLLABLE PORTAL VIEW (showTicketForm = false) ─── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* Title & Tagline */}
          <View style={[styles.titleSection, { alignItems: dirItems(isRTL) }]}>
            <View style={[styles.titleRow, { flexDirection: dirRow(isRTL) }]}>
              <Ionicons name="information-circle" size={24} color="#1E293B" style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
              <Text style={styles.titleText}>{helpCenterText}</Text>
            </View>
            <Text style={styles.taglineText}>{tagLineText}</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <AppSearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={searchPlaceholder}
              accessibilityLabel={searchPlaceholder}
              isRTL={isRTL}
              showClear
              onClear={() => setSearch('')}
              showSubmit={false}
            />
          </View>

          {/* Quick Contact Grid */}
          {!search.trim() && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { textAlign: dirText(isRTL) }]}>{quickContactText}</Text>
              <View style={[styles.quickContactGrid, { flexDirection: dirRow(isRTL) }]}>
                {/* WhatsApp */}
                <Pressable style={[styles.contactCard, { backgroundColor: '#ECFDF5' }]} onPress={handleWhatsappPress}>
                  <View style={[styles.contactIconWrap, { backgroundColor: '#10B981' }]}>
                    <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.contactCardTitle}>WhatsApp</Text>
                  <Text style={styles.contactCardSub}>
                    {lang === 'ar' ? 'رد سريع' : lang === 'fr' ? 'Réponse rapide' : 'Fast response'}
                  </Text>
                </Pressable>

                {/* Live Chat */}
                <Pressable style={[styles.contactCard, { backgroundColor: '#EFF6FF' }]} onPress={() => router.push('/(tabs)/chat')}>
                  <View style={[styles.contactIconWrap, { backgroundColor: '#3B82F6' }]}>
                    <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.contactCardTitle}>Live Chat</Text>
                  <Text style={styles.contactCardSub}>
                    {lang === 'ar' ? 'دردشة' : lang === 'fr' ? 'Discuter' : 'Chat'}
                  </Text>
                </Pressable>

                {/* Phone Call */}
                <Pressable style={[styles.contactCard, { backgroundColor: '#FFFBEB' }]} onPress={handleCallPress}>
                  <View style={[styles.contactIconWrap, { backgroundColor: '#F59E0B' }]}>
                    <Ionicons name="call" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.contactCardTitle}>
                    {lang === 'ar' ? 'اتصال' : lang === 'fr' ? 'Appeler' : 'Call'}
                  </Text>
                  <Text style={styles.contactCardSub}>
                    {lang === 'ar' ? 'اتصل بنا' : lang === 'fr' ? 'Nous joindre' : 'Contact us'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Accordion FAQ Items */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: dirText(isRTL) }]}>
              {search.trim() ? `${faqText} - ${search}` : faqText}
            </Text>

            {isFaqLoading ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={BRAND.RED} />
              </View>
            ) : filteredFaqItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTxt}>
                  {lang === 'ar' ? 'لا توجد نتائج' : 'Aucun résultat trouvé'}
                </Text>
              </View>
            ) : (
              <View style={styles.faqCard}>
                {filteredFaqItems.map((item, idx) => {
                  const question = currentIsRTL ? item.titleAr : item.titleFr;
                  const answer = currentIsRTL ? item.bodyAr : item.bodyFr;
                  const isOpen = expandedFaqKey === item.slug;

                  return (
                    <AccordionFaqItem
                      key={item.slug}
                      item={{ q: question, a: answer }}
                      isOpen={isOpen}
                      onToggle={() => toggleFaq(item.slug)}
                      currentIsRTL={currentIsRTL}
                    />
                  );
                })}
              </View>
            )}
          </View>

          {/* Bottom Send Request Button */}
          <Pressable
            style={({ pressed }) => [
              styles.bottomBtn,
              { flexDirection: dirRow(isRTL) },
              pressed && { backgroundColor: '#FEF2F2' },
            ]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowTicketForm(true);
            }}
          >
            <Ionicons name="information-circle-outline" size={20} color="#EF4444" style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
            <Text style={styles.bottomBtnTxt}>{sendRequestText}</Text>
          </Pressable>
        </ScrollView>
      ) : (
        /* ─── TICKET SUBMISSION FORM VIEW (showTicketForm = true) ─── */
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.formScroll, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={[styles.titleSection, { alignItems: dirItems(isRTL), marginBottom: 20 }]}>
              <Text style={styles.titleText}>
                {lang === 'ar' ? 'فتح تذكرة دعم' : 'Créer un ticket support'}
              </Text>
              <Text style={styles.taglineText}>
                {lang === 'ar' ? 'صف مشكلتك وسنتواصل معك في أقرب وقت' : 'Décrivez votre problème et nous vous contacterons sous peu.'}
              </Text>
            </View>

            {/* Category Select Grid */}
            <Text style={[styles.formLabel, { textAlign: dirText(isRTL) }]}>
              {lang === 'ar' ? 'نوع المشكلة' : 'Type de problème'} <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.catGrid, { flexDirection: dirRow(isRTL) }]}>
              {CATEGORIES.map(cat => {
                const active = category === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={[styles.catItem, active && { borderColor: cat.color, backgroundColor: `${cat.color}12` }]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <View style={[styles.catIconWrapInner, { backgroundColor: `${cat.color}18` }]}>
                      <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                    </View>
                    <Text style={[styles.catLabelText, active && { color: cat.color }]}>
                      {lang === 'ar' ? cat.label : cat.id === 'order' ? 'Commande' : cat.id === 'payment' ? 'Paiement' : cat.id === 'account' ? 'Compte' : cat.id === 'driver' ? 'Livreur' : cat.id === 'app' ? 'Technique' : 'Autre'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Urgency */}
            <Text style={[styles.formLabel, { textAlign: dirText(isRTL) }]}>
              {lang === 'ar' ? 'الأولوية' : 'Priorité'}
            </Text>
            <View style={[styles.urgencyRow, { flexDirection: dirRow(isRTL) }]}>
              {URGENCY.map(u => {
                const active = urgency === u.id;
                return (
                  <Pressable
                    key={u.id}
                    style={[styles.urgencyItem, active && { borderColor: u.color, backgroundColor: `${u.color}12` }]}
                    onPress={() => setUrgency(u.id)}
                  >
                    <View style={[styles.urgencyDot, { backgroundColor: u.color }]} />
                    <Text style={[styles.urgencyLabel, active && { color: u.color }]}>
                      {lang === 'ar' ? u.label : u.id === 'normal' ? 'Normal' : u.id === 'high' ? 'Important' : 'Urgent'}
                    </Text>
                    <Text style={styles.urgencySub}>
                      {lang === 'ar' ? u.sub : u.id === 'normal' ? 'Sous 24h' : u.id === 'high' ? 'Sous 4h' : 'Immédiat'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Order ID */}
            <Text style={[styles.formLabel, { textAlign: dirText(isRTL) }]}>
              {lang === 'ar' ? 'رقم الطلب (اختياري)' : 'N° de commande (optionnel)'}
            </Text>
            <TextInput
              style={[styles.formInput, { textAlign: dirText(isRTL) }]}
              placeholder="e.g. JHZ-12345"
              placeholderTextColor="#94A3B8"
              value={orderId}
              onChangeText={setOrderId}
              editable={!submitting}
            />

            {/* Subject */}
            <Text style={[styles.formLabel, { textAlign: dirText(isRTL) }]}>
              {lang === 'ar' ? 'عنوان المشكلة' : 'Sujet'} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.formInput, { textAlign: dirText(isRTL) }]}
              placeholder={lang === 'ar' ? 'عنوان مختصر' : 'Sujet résumé'}
              placeholderTextColor="#94A3B8"
              value={subject}
              onChangeText={setSubject}
              maxLength={80}
              editable={!submitting}
            />

            {/* Message */}
            <Text style={[styles.formLabel, { textAlign: dirText(isRTL) }]}>
              {lang === 'ar' ? 'تفاصيل المشكلة' : 'Détails du message'} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.formTextarea, { textAlign: dirText(isRTL) }]}
              placeholder={lang === 'ar' ? 'اشرح المشكلة...' : 'Expliquez en détail...'}
              placeholderTextColor="#94A3B8"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              editable={!submitting}
            />

            {/* Submit Button */}
            <Pressable
              style={[styles.submitFormBtn, !canSubmit && styles.submitFormBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              <Text style={styles.submitFormBtnTxt}>
                {submitting 
                  ? (lang === 'ar' ? 'جارٍ الإرسال...' : 'Envoi...') 
                  : (lang === 'ar' ? 'إرسال التذكرة' : 'Envoyer la demande')}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND.BG,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    justifyContent: 'space-between',
    backgroundColor: BRAND.BG,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 4,
  },
  titleRow: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: 20,
    fontFamily: FONTS.DISPLAY,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  taglineText: {
    fontSize: 14,
    fontFamily: FONTS.BODY,
    color: '#64748B',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.SEMIBOLD,
    color: '#64748B',
    marginBottom: 12,
  },
  quickContactGrid: {
    gap: 10,
  },
  contactCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  contactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCardTitle: {
    fontSize: 13,
    fontFamily: FONTS.DISPLAY,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  contactCardSub: {
    fontSize: 11,
    fontFamily: FONTS.BODY,
    color: '#64748B',
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  categoryRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 12,
  },
  categoryBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: FONTS.SEMIBOLD,
    color: '#1E293B',
    fontWeight: '600',
  },
  categoryFaqContainer: {
    backgroundColor: BRAND.BG,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  faqWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  faqHeader: {
    alignItems: 'center',
    gap: 8,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.SEMIBOLD,
    color: '#334155',
  },
  faqAnswerContainer: {
    marginTop: 6,
    gap: 8,
  },
  faqAnswerLine: {
    width: 2.5,
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  faqAnswerTxt: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONTS.BODY,
    color: '#64748B',
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  emptyTxt: {
    fontSize: 13.5,
    fontFamily: FONTS.BODY,
    color: '#94A3B8',
  },
  bottomBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBtnTxt: {
    fontSize: 14,
    fontFamily: FONTS.SEMIBOLD,
    color: '#EF4444',
    fontWeight: 'bold',
  },

  /* ─── Ticket Submission Form Styles ─── */
  formScroll: {
    paddingBottom: 40,
  },
  formLabel: {
    fontSize: 13.5,
    fontFamily: FONTS.SEMIBOLD,
    color: '#475569',
    marginTop: 18,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  required: {
    color: BRAND.RED,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
  },
  catItem: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  catIconWrapInner: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catLabelText: {
    fontSize: 11,
    fontFamily: FONTS.SEMIBOLD,
    color: '#1E293B',
    textAlign: 'center',
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
  },
  urgencyItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  urgencyLabel: {
    fontSize: 12,
    fontFamily: FONTS.SEMIBOLD,
    color: '#1E293B',
    marginBottom: 2,
  },
  urgencySub: {
    fontSize: 9,
    fontFamily: FONTS.BODY,
    color: '#94A3B8',
  },
  formInput: {
    marginHorizontal: 20,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: FONTS.BODY,
    color: '#1E293B',
  },
  formTextarea: {
    marginHorizontal: 20,
    height: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 14,
    fontSize: 14,
    fontFamily: FONTS.BODY,
    color: '#1E293B',
    textAlignVertical: 'top',
  },
  submitFormBtn: {
    marginHorizontal: 20,
    marginTop: 28,
    height: 48,
    borderRadius: 16,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitFormBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  submitFormBtnTxt: {
    fontSize: 14,
    fontFamily: FONTS.SEMIBOLD,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  /* ─── Success screen ─── */
  successRoot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBg: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  successTitle: {
    fontSize: 20,
    fontFamily: FONTS.DISPLAY,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 13.5,
    fontFamily: FONTS.BODY,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  ticketRef: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    width: '100%',
  },
  ticketRefLabel: {
    fontSize: 12,
    fontFamily: FONTS.BODY,
    color: '#94A3B8',
    marginBottom: 4,
  },
  ticketRefVal: {
    fontSize: 18,
    fontFamily: FONTS.DISPLAY,
    fontWeight: 'bold',
    color: BRAND.RED,
    letterSpacing: 1,
  },
  backHomeBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: BRAND.RED,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHomeTxt: {
    fontSize: 14,
    fontFamily: FONTS.SEMIBOLD,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
