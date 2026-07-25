import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { BRAND, FONTS, SHADOW_SM } from '../../constants/brand';
import { useLangStore } from '../../store/languageStore';

const TABS_AR = ['شروط الاستخدام', 'سياسة الخصوصية'];
const TABS_FR = ["Conditions d'utilisation", 'Politique de confidentialité'];
const TABS_EN = ['Terms of Use', 'Privacy Policy'];

const TERMS_AR = `شروط وأحكام استخدام تطبيق جاهز

تاريخ آخر تحديث: مايو 2025

مرحباً بك في تطبيق جاهز. باستخدامك للتطبيق، فأنت توافق على هذه الشروط والأحكام كاملةً.

1. قبول الشروط
يُعدّ استخدامك للتطبيق إقراراً منك بقراءة هذه الشروط وفهمها والموافقة عليها. إن كنت لا توافق على أي من هذه البنود، يُرجى عدم استخدام التطبيق.

2. الخدمة المقدَّمة
يُتيح تطبيق جاهز للمستخدمين طلب خدمات التوصيل من المتاجر المحلية في مدينة آسفي، بما في ذلك الطعام والبقالة والصيدلية والمهام الخاصة.

3. الأهلية
يجب أن يكون عمرك 16 عاماً على الأقل لاستخدام التطبيق. باستخدامك التطبيق، فأنت تُقرّ بأنك تستوفي هذا الشرط.

4. حسابك ومسؤوليتك
• أنت مسؤول عن سرية بيانات حسابك.
• يُمنع مشاركة حسابك مع الآخرين.
• يجب الإبلاغ فوراً عن أي استخدام غير مصرّح به لحسابك.

5. الطلبات والدفع
• تُعدّ جميع الطلبات المُؤكَّدة ملزمةً.
• يُحتسب سعر التوصيل بناءً على المسافة والمتجر.
• يحق لنا رفض أي طلب دون إبداء أسباب.

6. الإلغاء والاسترداد
• يمكن إلغاء الطلب مجاناً قبل بدء التحضير.
• بعد بدء التحضير، يخضع الإلغاء لرسوم.
• تُعالَج طلبات الاسترداد خلال 3-7 أيام عمل.

7. سلوك المستخدم
يُحظر استخدام التطبيق لأغراض غير مشروعة أو مسيئة. يحق لنا إيقاف الحساب فوراً في حال المخالفة.

8. الملكية الفكرية
جميع حقوق الملكية الفكرية للتطبيق محفوظة لشركة جاهز. لا يُسمح بنسخ أو توزيع أي محتوى دون إذن مسبق.

9. تحديد المسؤولية
لا تتحمل جاهز المسؤولية عن أي أضرار غير مباشرة ناتجة عن استخدام التطبيق أو خدمات الطرف الثالث.

10. التعديلات
نحتفظ بحق تعديل هذه الشروط في أي وقت. سيُخطَر المستخدمون بأي تغييرات جوهرية.

11. القانون المطبَّق
تخضع هذه الشروط لأحكام القانون المغربي، وتختص المحاكم المغربية بالنظر في أي نزاع.

للتواصل معنا: support@jaheez.ma`;

const PRIVACY_AR = `سياسة الخصوصية لتطبيق جاهز

تاريخ آخر تحديث: مايو 2025

نُولي جاهز خصوصيتك أهمية بالغة. توضّح هذه السياسة كيفية جمعنا لمعلوماتك واستخدامها وحمايتها.

1. البيانات التي نجمعها
• معلومات الحساب: الاسم الكامل، رقم الهاتف، البريد الإلكتروني.
• بيانات الطلبات: تاريخ الطلبات، العناوين، طرق الدفع.
• بيانات الجهاز: نوع الجهاز، نظام التشغيل، معرّف الجهاز.
• بيانات الموقع: موقعك الجغرافي لتوصيل الطلبات (بإذنك فقط).

2. كيفية استخدام البيانات
• معالجة طلباتك وتتبّعها.
• التواصل معك بشأن طلباتك.
• تحسين تجربة المستخدم.
• الامتثال للمتطلبات القانونية.

3. مشاركة البيانات
• مع السائقين: الاسم والعنوان لإتمام التوصيل.
• مع المتاجر: تفاصيل الطلب فقط.
• لا نبيع بياناتك لأي طرف ثالث.

4. الاحتفاظ بالبيانات
نحتفظ ببياناتك طالما كان حسابك نشطاً. عند حذف الحساب، يُحذف محتواه خلال 30 يوماً.

5. حقوقك
• الاطلاع على بياناتك.
• تصحيح بياناتك.
• طلب حذف بياناتك.
• الاعتراض على معالجة بياناتك.

6. الأمان
نستخدم تشفير SSL/TLS لجميع الاتصالات وتخزين البيانات في بيئات آمنة.

7. ملفات تعريف الارتباط
يستخدم التطبيق ملفات الجلسة لتحسين تجربتك ولا يستخدم تتبعاً إعلانياً.

8. التواصل
لأي استفسارات حول خصوصيتك: privacy@jaheez.ma`;

export default function TermsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { lang } = useLangStore();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState(tabParam === '1' ? 1 : 0);

  const tabs    = lang === 'fr' ? TABS_FR : lang === 'en' ? TABS_EN : TABS_AR;
  const content = tab === 0 ? TERMS_AR : PRIVACY_AR;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} accessibilityLabel="رجوع">
          <AppIcon name="arrow-back" size={20} color={BRAND.TEXT} />
        </Pressable>
        <Text style={styles.headerTitle}>{tabs[tab]}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabs}>
        {tabs.map((label, idx) => (
          <Pressable
            key={idx}
            onPress={() => setTab(idx)}
            style={[styles.tab, tab === idx && styles.tabActive]}
          >
            <Text style={[styles.tabTxt, tab === idx && styles.tabTxtActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.body}>{content}</Text>
        </View>

        {/* Contact */}
        <View style={styles.contactCard}>
          <AppIcon name="mail-outline" size={20} color={BRAND.RED} />
          <View style={styles.contactText}>
            <Text style={styles.contactTitle}>تواصل معنا</Text>
            <Text style={styles.contactSub}>support@jaheez.ma</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: BRAND.BG },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BRAND.BORDER,
    backgroundColor: BRAND.BG,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: BRAND.SURFACE, alignItems: 'center', justifyContent: 'center', ...SHADOW_SM,
  },
  headerTitle: { fontFamily: FONTS.DISPLAY, fontSize: 18, color: BRAND.TEXT },

  tabs: {
    flexDirection: 'row-reverse', paddingHorizontal: 20, paddingVertical: 12,
    gap: 10, backgroundColor: BRAND.BG,
    borderBottomWidth: 1, borderBottomColor: BRAND.BORDER,
  },
  tab: {
    flex: 1, paddingVertical: 9, borderRadius: 12,
    backgroundColor: BRAND.LIGHT, alignItems: 'center',
  },
  tabActive: { backgroundColor: BRAND.RED },
  tabTxt: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT2 },
  tabTxtActive: { color: '#FFFFFF' },

  scroll: { padding: 20, gap: 16 },
  card: {
    backgroundColor: BRAND.SURFACE, borderRadius: 18,
    padding: 20, borderWidth: 1, borderColor: BRAND.BORDER,
  },
  body: {
    fontFamily: FONTS.BODY, fontSize: 14, color: BRAND.TEXT2,
    lineHeight: 26, textAlign: 'right',
  },

  contactCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 14,
    backgroundColor: BRAND.RED_LIGHT, borderRadius: 16, padding: 16,
  },
  contactText: { flex: 1, alignItems: 'flex-end' },
  contactTitle: { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.TEXT, marginBottom: 2 },
  contactSub: { fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT2 },
});
