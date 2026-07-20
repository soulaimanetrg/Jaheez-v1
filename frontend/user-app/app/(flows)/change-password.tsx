import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, KeyboardAvoidingView,
  Platform, ScrollView, Pressable, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@/components/ui/Ionicons';
import { MotiView } from 'moti';
import { BRAND, FONTS, SHADOW, SHADOW_RED } from '../../constants/brand';
import { useLangStore } from '../../store/languageStore';
import { backendJson } from '../../lib/backendApi';

const { width, height } = Dimensions.get('window');
const HERO_H = height * 0.22;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLangStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMsg(null);

    // Simple validation
    if (!currentPassword) {
      setErrorMsg(isRTL ? 'كلمة المرور الحالية مطلوبة.' : 'Le mot de passe actuel est requis.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg(isRTL ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.' : 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(isRTL ? 'كلمتا المرور غير متطابقتين.' : 'Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await backendJson<{ success: boolean; message: string }>('/admin-api/v1/customer/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword: password,
          confirmPassword,
        }),
      });

      if (res.success) {
        Alert.alert(
          isRTL ? 'نجاح' : 'Succès',
          isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Le mot de passe a été modifié avec succès.',
          [{ text: isRTL ? 'موافق' : 'OK', onPress: () => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile') }]
        );
      } else {
        throw new Error(isRTL ? 'فشل تغيير كلمة المرور' : 'Échec du changement de mot de passe');
      }
    } catch (e: any) {
      setErrorMsg(e.message || (isRTL ? 'حدث خطأ ما' : 'Une erreur est survenue.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      {/* ── HERO ── */}
      <LinearGradient
        colors={['#F03030', '#C42020', '#9A0000']}
        style={[s.hero, { paddingTop: insets.top + 8 }]}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
      >
        <View style={s.ring1} />
        <View style={s.ring2} />
        <Pressable
          style={s.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}
          accessibilityLabel={t.back}
        >
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color="rgba(255,255,255,0.9)" />
        </Pressable>
        <View style={s.heroContent}>
          <Text style={s.heroLogo}>JaheeZ</Text>
          <Text style={s.heroTagline}>{t.changePassword}</Text>
        </View>
      </LinearGradient>

      {/* ── FORM SHEET ── */}
      <KeyboardAvoidingView
        style={s.formSheet}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[s.formInner, { paddingBottom: insets.bottom + 28 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 340 } as any}
          >
            <Text style={s.formTitle}>{t.changePassword}</Text>
            <Text style={s.formSub}>
              {isRTL ? 'أدخل كلمة المرور الجديدة وتأكيدها أدناه' : 'Entrez votre nouveau mot de passe ci-dessous'}
            </Text>
          </MotiView>

          {/* ── ERROR BANNER ── */}
          {errorMsg && (
            <MotiView
              from={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 240 } as any}
              style={s.errorBanner}
            >
              <Ionicons name="alert-circle" size={16} color={BRAND.ERROR} />
              <Text style={s.errorText}>{errorMsg}</Text>
            </MotiView>
          )}

          {/* ── CURRENT PASSWORD INPUT ── */}
          <View style={s.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={BRAND.RED} style={s.inputIcon} />
            <TextInput
              style={s.inputField}
              placeholder={isRTL ? 'كلمة المرور الحالية' : 'Mot de passe actuel'}
              placeholderTextColor={BRAND.TEXT3}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPw}
              textAlign={isRTL ? 'right' : 'left'}
              autoComplete="password"
            />
            <Pressable onPress={() => setShowCurrentPw(!showCurrentPw)} style={s.eyeBtn} accessibilityLabel="إظهار/إخفاء">
              <Ionicons name={showCurrentPw ? 'eye-outline' : 'eye-off-outline'} size={20} color={BRAND.TEXT3} />
            </Pressable>
          </View>

          {/* ── NEW PASSWORD INPUT ── */}
          <View style={s.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={BRAND.RED} style={s.inputIcon} />
            <TextInput
              style={s.inputField}
              placeholder={isRTL ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
              placeholderTextColor={BRAND.TEXT3}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              textAlign={isRTL ? 'right' : 'left'}
              autoComplete="password"
            />
            <Pressable onPress={() => setShowPw(!showPw)} style={s.eyeBtn} accessibilityLabel="إظهار/إخفاء">
              <Ionicons name={showPw ? 'eye-outline' : 'eye-off-outline'} size={20} color={BRAND.TEXT3} />
            </Pressable>
          </View>

          {/* ── CONFIRM PASSWORD INPUT ── */}
          <View style={s.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={BRAND.RED} style={s.inputIcon} />
            <TextInput
              style={s.inputField}
              placeholder={isRTL ? 'تأكيد كلمة المرور الجديدة' : 'Confirmer le mot de passe'}
              placeholderTextColor={BRAND.TEXT3}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPw}
              textAlign={isRTL ? 'right' : 'left'}
              autoComplete="password"
            />
            <Pressable onPress={() => setShowConfirmPw(!showConfirmPw)} style={s.eyeBtn} accessibilityLabel="إظهار/إخفاء">
              <Ionicons name={showConfirmPw ? 'eye-outline' : 'eye-off-outline'} size={20} color={BRAND.TEXT3} />
            </Pressable>
          </View>

          {/* ── SUBMIT BUTTON ── */}
          <Pressable
            style={({ pressed }) => [s.submitBtn, pressed && s.btnPressed, loading && s.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityLabel={t.save}
          >
            <LinearGradient colors={['#F03030', '#C42020']} style={s.submitGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.submitText}>{t.save}</Text>
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.BG },

  hero: {
    height: HERO_H, overflow: 'hidden', position: 'relative',
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  ring1: {
    position: 'absolute', width: width * 1.6, height: width * 1.6,
    borderRadius: width * 0.8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    top: -width * 0.72, left: -width * 0.32,
  },
  ring2: {
    position: 'absolute', width: width * 0.70, height: width * 0.70,
    borderRadius: width * 0.35, backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -width * 0.22, right: -width * 0.18,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start', marginLeft: 20, marginTop: 4,
  },
  heroContent: { alignItems: 'center', paddingTop: 4 },
  heroLogo:    { fontFamily: FONTS.DISPLAY, fontSize: 32, color: '#fff', letterSpacing: -1 },
  heroTagline: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: 'rgba(255,255,255,0.80)', marginTop: 2 },

  formSheet: {
    flex: 1, backgroundColor: BRAND.BG, marginTop: -20,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
  },
  formInner: { padding: 22, paddingTop: 28 },
  formTitle: {
    fontFamily: FONTS.DISPLAY, fontSize: 22, color: BRAND.TEXT,
    textAlign: 'center', marginBottom: 4,
  },
  formSub: {
    fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT2,
    textAlign: 'center', marginBottom: 24,
  },

  errorBanner: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12,
    borderWidth: 1, borderColor: '#FECACA',
    padding: 12, marginBottom: 16,
  },
  errorText: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.ERROR, flex: 1, textAlign: 'right' },

  inputRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: BRAND.SURFACE, borderRadius: 14, height: 56,
    paddingHorizontal: 14, marginBottom: 16,
    borderWidth: 1.5, borderColor: BRAND.BORDER, ...SHADOW,
  },
  inputIcon:  { marginLeft: 8 },
  inputField: { flex: 1, fontFamily: FONTS.BODY, fontSize: 15, color: BRAND.TEXT, height: '100%' },
  eyeBtn:      { padding: 4 },

  submitBtn:  { borderRadius: 16, marginTop: 8, overflow: 'hidden', ...SHADOW_RED },
  submitGrad: { height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  btnPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  btnDisabled:{ opacity: 0.6 },
  submitText: { fontFamily: FONTS.SEMIBOLD, fontSize: 17, color: '#fff' },
});
