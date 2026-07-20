import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@/components/ui/Ionicons';
import { BRAND, FONTS, SHADOW_SM } from '../../constants/brand';
import { useLangStore } from '../../store/languageStore';
import { dirRow } from '../../lib/direction';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isRTL } = useLangStore();

  const scrollY = useRef(new Animated.Value(0)).current;

  // Unified header scroll animations
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [10, 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const buttonFadeIn = headerBgOpacity;
  const buttonFadeOut = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      {/* ── Unified Floating Header ───────────────────── */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.fixedHeader,
          {
            height: insets.top + 56,
            paddingTop: insets.top,
            flexDirection: dirRow(isRTL),
          },
        ]}
      >
        <Animated.View style={[styles.fixedHeaderBg, { opacity: headerBgOpacity }]} />

        {/* Dynamic Back Button (Fades color on scroll) */}
        <View style={{ width: 40, height: 40, position: 'relative' }}>
          <Animated.View style={{ ...StyleSheet.absoluteFillObject, opacity: buttonFadeOut }}>
            <Pressable
              style={styles.backBtn}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
            >
              <Ionicons name="arrow-back" size={20} color="#FFF" />
            </Pressable>
          </Animated.View>
          <Animated.View style={{ ...StyleSheet.absoluteFillObject, opacity: buttonFadeIn }}>
            <Pressable
              style={styles.fixedHeaderBtnDark}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
            >
              <Ionicons name="arrow-back" size={20} color="#171717" />
            </Pressable>
          </Animated.View>
        </View>

        {/* Centered Title */}
        <View style={styles.fixedHeaderCenter}>
          <Text
            style={styles.fixedHeaderTitle}
            numberOfLines={1}
          >
            طرق الدفع
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        <LinearGradient
          colors={['#F03030', '#C42020', '#9A0000']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 36 }]}
        >
          <View style={styles.heroRow}>
            <View style={styles.heroBadge}>
              <Ionicons name="pause-circle-outline" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroBadgeTxt}>الدفع الإلكتروني متوقف مؤقتًا</Text>
            </View>
            {/* Empty space placeholder for aligned row */}
            <View style={{ width: 40 }} />
          </View>
          <Text style={[styles.heroSub, { textAlign: 'center', marginTop: 12 }]}>نعمل على مزود دفع مناسب أكثر للسوق المغربي</Text>
        </LinearGradient>

        <View style={styles.noticeCard}>
          <View style={styles.noticeIcon}>
            <Ionicons name="card-outline" size={28} color={BRAND.RED} />
          </View>
          <Text style={styles.noticeTitle}>البطاقات البنكية غير متاحة الآن</Text>
          <Text style={styles.noticeText}>
            تم إيقاف الدفع بالبطاقة مؤقتًا بينما نجهز مزود دفع متوافقًا أكثر مع المغرب. لن يتم حفظ أو طلب أي بيانات بطاقة في هذه المرحلة.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>الدفع المتاح حاليًا</Text>
        <View style={styles.optionCard}>
          <View style={styles.optionRow}>
            <View style={styles.enabledBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#FFF" />
              <Text style={styles.enabledText}>مفعل</Text>
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>الدفع عند الاستلام</Text>
              <Text style={styles.optionSub}>ادفع للسائق نقدًا عند وصول الطلب.</Text>
            </View>
            <View style={styles.optionIcon}>
              <Ionicons name="cash-outline" size={24} color={BRAND.GREEN} />
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.BG },
  hero: { paddingHorizontal: 20, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  heroBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  heroBadgeTxt: { fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: '#FFF' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: FONTS.DISPLAY, fontSize: 28, color: '#FFF', textAlign: 'right' },
  heroSub: { fontFamily: FONTS.BODY, fontSize: 14, color: 'rgba(255,255,255,0.86)', textAlign: 'right', marginTop: 6 },
  scroll: { padding: 20 },
  noticeCard: { backgroundColor: BRAND.SURFACE, borderRadius: 20, padding: 20, alignItems: 'flex-end', borderWidth: 1, borderColor: BRAND.BORDER, ...SHADOW_SM },
  noticeIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: BRAND.RED_LIGHT, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  noticeTitle: { fontFamily: FONTS.DISPLAY, fontSize: 18, color: BRAND.TEXT, textAlign: 'right', marginBottom: 8 },
  noticeText: { fontFamily: FONTS.BODY, fontSize: 14, lineHeight: 22, color: BRAND.TEXT2, textAlign: 'right' },
  sectionLabel: { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.TEXT2, textAlign: 'right', marginTop: 22, marginBottom: 10 },
  optionCard: { backgroundColor: BRAND.SURFACE, borderRadius: 18, borderWidth: 1, borderColor: BRAND.BORDER, overflow: 'hidden', ...SHADOW_SM },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 16 },
  enabledBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: BRAND.GREEN, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  enabledText: { fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: '#FFF' },
  optionInfo: { flex: 1, alignItems: 'flex-end' },
  optionTitle: { fontFamily: FONTS.SEMIBOLD, fontSize: 15, color: BRAND.TEXT, marginBottom: 3 },
  optionSub: { fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.TEXT3 },
  optionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5' },
  fixedHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fixedHeaderBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fixedHeaderBtnDark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fixedHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedHeaderTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#171717',
  },
});
