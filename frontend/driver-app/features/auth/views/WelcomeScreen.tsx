import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND, FONTS } from '@/constants/brand';
import { useLangStore } from '@/lib/i18n';

export function WelcomeScreen() {
  const router = useRouter();
  const t = useLangStore(s => s.t);
  const lang = useLangStore(s => s.lang);
  const setLang = useLangStore(s => s.setLang);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[BRAND.RED_DARK, BRAND.RED, '#1A0606']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
        <SafeAreaView edges={['top']} style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'space-between', paddingBottom: 36 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 12 }}>
            <Pressable onPress={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
              style={{ paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999 }}>
              <Text style={{ color: '#fff', fontFamily: FONTS.SEMIBOLD, fontSize: 13 }}>
                {lang === 'fr' ? 'العربية' : 'Français'}
              </Text>
            </Pressable>
          </View>

          <View style={{ alignItems: 'center', gap: 14 }}>
            <Text style={{ color: BRAND.YELLOW, fontFamily: FONTS.DISPLAY, fontSize: 64, letterSpacing: -1 }}>JaheeZ</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: FONTS.SEMIBOLD, fontSize: 18, letterSpacing: 4 }}>LIVREUR</Text>
            <View style={{ height: 28 }} />
            <Text style={{ color: '#fff', fontFamily: FONTS.DISPLAY, fontSize: 28, textAlign: 'center', lineHeight: 36 }}>
              {t.welcomeTitle}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontFamily: FONTS.BODY, fontSize: 15, textAlign: 'center', maxWidth: 320 }}>
              {t.welcomeSub}
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            <Pressable onPress={() => router.push('/(auth)/login')}
              style={{ backgroundColor: BRAND.YELLOW, paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}>
              <Text style={{ color: BRAND.RED_DARK, fontFamily: FONTS.DISPLAY, fontSize: 17 }}>{t.getStarted}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
