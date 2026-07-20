import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { BRAND, FONTS, SHADOW_SM } from '../../constants/brand';
import { useAuthStore } from '../../store/authStore';
import { useLangStore } from '../../store/languageStore';
import { supabase } from '../../lib/supabase';
import { infobipSendOTP } from '../../lib/infobipOtp';
import { logoutUser } from '../../lib/authApi';
import { adminApiUrl } from '../../lib/adminApi';

const REASONS_FR = [
  "Je n'utilise plus l'application",
  'Problèmes de qualité de service',
  'Préoccupations concernant la confidentialité',
  "J'ai un autre compte",
  'Autre',
];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { lang } = useLangStore();
  const isAr = lang === 'ar';

  const [step, setStep]               = useState<1 | 2 | 3>(1);
  const [reason, setReason]           = useState<string>('');
  const [sendingOtp, setSendingOtp]   = useState(false);
  const [otpSent, setOtpSent]         = useState(false);
  const [code, setCode]               = useState('');
  const [verifying, setVerifying]     = useState(false);
  const [otpProof, setOtpProof]       = useState<string | null>(null);
  const [confirmed, setConfirmed]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const goBack = () => {
    if (step === 1) router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
    else setStep((step - 1) as 1 | 2);
  };

  // ── Step 1 → 2: send OTP to user phone ─────────────────────
  const proceedToOtp = async () => {
    if (!user?.phone) {
      setError(isAr ? 'لا يوجد رقم هاتف مسجل' : 'Aucun numéro enregistré');
      return;
    }
    setError(null);
    setSendingOtp(true);
    const r = await infobipSendOTP(user.phone);
    setSendingOtp(false);
    if (r.error) { setError(r.error); return; }
    setOtpSent(true);
    setStep(2);
  };

  // ── Step 2: verify OTP and obtain otp_proof token ─────────
  const verifyCode = async () => {
    if (!user?.phone) return;
    if (code.trim().length < 4) {
      setError(isAr ? 'رمز غير صالح' : 'Code invalide');
      return;
    }
    setError(null);
    setVerifying(true);
    try {
      // Call /admin-api/otp/verify directly to capture the otp_proof JWT it
      // issues — infobipVerifyOTP() in this codebase returns only {verified}.
      const res = await fetch(adminApiUrl('/admin-api/otp/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.otp_proof) {
        setError(json.error || (isAr ? 'رمز غير صحيح' : 'Code incorrect'));
        return;
      }
      setOtpProof(json.otp_proof);
      setStep(3);
    } catch (e: any) {
      setError(e?.message || (isAr ? 'فشل التحقق' : 'Échec de la vérification'));
    } finally {
      setVerifying(false);
    }
  };

  const resendOtp = async () => {
    if (!user?.phone) return;
    setError(null);
    setSendingOtp(true);
    const r = await infobipSendOTP(user.phone);
    setSendingOtp(false);
    if (r.error) setError(r.error);
  };

  // ── Step 3: final confirmation → server delete ───────────
  const finalDelete = async () => {
    if (!confirmed || !otpProof || !user?.id) return;
    setError(null);
    setSubmitting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess?.session?.access_token;
      if (!accessToken) {
        throw new Error(isAr ? 'الجلسة منتهية' : 'Session expirée');
      }
      const res = await fetch(adminApiUrl('/admin-api/auth/account'), {
        method:  'DELETE',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body:    JSON.stringify({ otp_proof: otpProof, reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Échec de la suppression');

      // Local cleanup — server already revoked Supabase session.
      await supabase.auth.signOut().catch(() => {});
      await logoutUser().catch(() => {});
      logout();
      router.replace('/(auth)/login' as any);
    } catch (e: any) {
      setError(e?.message || (isAr ? 'فشل الحذف' : 'Échec'));
    } finally {
      setSubmitting(false);
    }
  };

  const dirStyle = { textAlign: (isAr ? 'right' : 'left') as 'left' | 'right' };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={BRAND.TEXT} />
        </Pressable>
        <Text style={styles.headerTitle}>{isAr ? 'حذف الحساب' : 'Supprimer mon compte'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress dots */}
      <View style={styles.progress}>
        {[1, 2, 3].map(n => (
          <View key={n} style={[
            styles.dot,
            n === step && styles.dotActive,
            n < step && styles.dotDone,
          ]}>
            {n < step
              ? <Ionicons name="checkmark" size={14} color="#fff" />
              : <Text style={[styles.dotTxt, n === step && { color: '#fff' }]}>{n}</Text>}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={BRAND.RED} />
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        )}

        {/* ── STEP 1 ─────────────────────────────────────── */}
        {step === 1 && (
          <View>
            <View style={styles.warnBox}>
              <Ionicons name="warning" size={20} color={BRAND.RED} />
              <Text style={[styles.warnTxt, dirStyle]}>
                {isAr
                  ? 'سيؤدي حذف حسابك إلى فقدان طلباتك وعنواينك ومحفظتك بشكل دائم. لا يمكن التراجع.'
                  : "La suppression de votre compte effacera de manière permanente vos commandes, adresses et solde de portefeuille. Cette action est irréversible."}
              </Text>
            </View>

            <Text style={[styles.label, dirStyle]}>
              {isAr ? 'لماذا تغادرنا ؟ (اختياري)' : 'Pourquoi nous quittez-vous ? (optionnel)'}
            </Text>
            <View style={styles.reasonsList}>
              {REASONS_FR.map(r => (
                <Pressable
                  key={r}
                  onPress={() => setReason(r === reason ? '' : r)}
                  style={[styles.reason, reason === r && styles.reasonActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: reason === r }}
                >
                  <View style={[styles.radio, reason === r && styles.radioActive]}>
                    {reason === r && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.reasonTxt, reason === r && { color: BRAND.RED }]}>{r}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.btnPrimary, sendingOtp && styles.btnDisabled]}
              onPress={proceedToOtp}
              disabled={sendingOtp}
              accessibilityRole="button"
            >
              {sendingOtp
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryTxt}>{isAr ? 'متابعة' : 'Continuer'}</Text>}
            </Pressable>
          </View>
        )}

        {/* ── STEP 2 ─────────────────────────────────────── */}
        {step === 2 && (
          <View>
            <Text style={[styles.stepTitle, dirStyle]}>
              {isAr ? 'تأكيد رقم هاتفك' : 'Vérification de votre téléphone'}
            </Text>
            <Text style={[styles.stepBody, dirStyle]}>
              {isAr
                ? `أرسلنا رمزًا إلى ${user?.phone}. أدخله للمتابعة.`
                : `Un code a été envoyé au ${user?.phone}. Saisissez-le pour continuer.`}
            </Text>

            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="------"
              placeholderTextColor={BRAND.TEXT3}
              style={styles.codeInput}
              accessibilityLabel="OTP"
            />

            <Pressable onPress={resendOtp} disabled={sendingOtp}>
              <Text style={styles.linkTxt}>
                {sendingOtp
                  ? (isAr ? 'جارٍ الإرسال…' : 'Envoi…')
                  : (isAr ? 'إعادة إرسال الرمز' : 'Renvoyer le code')}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.btnPrimary, (verifying || code.length < 4) && styles.btnDisabled]}
              onPress={verifyCode}
              disabled={verifying || code.length < 4}
            >
              {verifying
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryTxt}>{isAr ? 'تحقق' : 'Vérifier'}</Text>}
            </Pressable>
          </View>
        )}

        {/* ── STEP 3 ─────────────────────────────────────── */}
        {step === 3 && (
          <View>
            <Text style={[styles.stepTitle, dirStyle]}>
              {isAr ? 'تأكيد نهائي' : 'Confirmation finale'}
            </Text>
            <Text style={[styles.stepBody, dirStyle]}>
              {isAr
                ? 'سيتم حذف حسابك فورًا. سيتم محو بياناتك الشخصية بالكامل بعد 30 يومًا.'
                : "Votre compte sera supprimé immédiatement. Vos données personnelles seront entièrement effacées après 30 jours."}
            </Text>

            <Pressable
              onPress={() => setConfirmed(!confirmed)}
              style={styles.checkRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: confirmed }}
            >
              <View style={[styles.check, confirmed && styles.checkOn]}>
                {confirmed && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={[styles.checkTxt, dirStyle, { flex: 1 }]}>
                {isAr
                  ? 'أفهم أن هذا الإجراء لا يمكن التراجع عنه.'
                  : 'Je comprends que cette action est irréversible.'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.btnDanger, (!confirmed || submitting) && styles.btnDisabled]}
              onPress={() => {
                if (Platform.OS === 'web') { finalDelete(); return; }
                Alert.alert(
                  isAr ? 'حذف الحساب' : 'Supprimer le compte',
                  isAr ? 'هل أنت متأكد ؟' : 'Êtes-vous sûr ?',
                  [
                    { text: isAr ? 'إلغاء' : 'Annuler', style: 'cancel' },
                    { text: isAr ? 'حذف' : 'Supprimer', style: 'destructive', onPress: finalDelete },
                  ]
                );
              }}
              disabled={!confirmed || submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryTxt}>{isAr ? 'حذف نهائيًا' : 'Supprimer définitivement'}</Text>}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BRAND.BORDER,
    backgroundColor: BRAND.SURFACE,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.SEMIBOLD, fontSize: 16, color: BRAND.TEXT },

  progress: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12,
    paddingVertical: 14, backgroundColor: BRAND.SURFACE,
    borderBottomWidth: 1, borderBottomColor: BRAND.BORDER2,
  },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: BRAND.BORDER, alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { backgroundColor: BRAND.RED },
  dotDone:   { backgroundColor: BRAND.GREEN || '#16A34A' },
  dotTxt: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT3 },

  errorBox: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: BRAND.RED_LIGHT, borderRadius: 12,
    padding: 12, marginBottom: 14,
  },
  errorTxt: { flex: 1, color: BRAND.RED, fontFamily: FONTS.SEMIBOLD, fontSize: 13 },

  warnBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: BRAND.RED_LIGHT, borderRadius: 14, padding: 14, marginBottom: 18,
    borderWidth: 1, borderColor: 'rgba(240,48,48,0.25)',
  },
  warnTxt: { flex: 1, fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.RED, lineHeight: 19 },

  label: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT2, marginBottom: 10 },

  reasonsList: { gap: 8, marginBottom: 24 },
  reason: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: BRAND.BORDER,
    backgroundColor: BRAND.SURFACE, ...SHADOW_SM,
  },
  reasonActive: { borderColor: BRAND.RED, backgroundColor: BRAND.RED_LIGHT },
  reasonTxt: { fontFamily: FONTS.BODY, fontSize: 14, color: BRAND.TEXT, flex: 1 },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: BRAND.BORDER, alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: BRAND.RED },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND.RED },

  stepTitle: { fontFamily: FONTS.DISPLAY, fontSize: 18, color: BRAND.TEXT, marginBottom: 8 },
  stepBody:  { fontFamily: FONTS.BODY, fontSize: 14, color: BRAND.TEXT2, lineHeight: 20, marginBottom: 18 },

  codeInput: {
    backgroundColor: BRAND.SURFACE, borderRadius: 14, borderWidth: 1, borderColor: BRAND.BORDER,
    fontSize: 24, letterSpacing: 8, textAlign: 'center', paddingVertical: 16,
    color: BRAND.TEXT, marginBottom: 12,
  },

  linkTxt: { color: BRAND.RED, fontFamily: FONTS.SEMIBOLD, fontSize: 13, textAlign: 'center', marginBottom: 24 },

  checkRow: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 14,
    backgroundColor: BRAND.SURFACE, borderRadius: 12,
    borderWidth: 1, borderColor: BRAND.BORDER, marginBottom: 18,
  },
  check: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: BRAND.BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  checkOn: { backgroundColor: BRAND.RED, borderColor: BRAND.RED },
  checkTxt: { fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT },

  btnPrimary: {
    backgroundColor: BRAND.RED, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnDanger: {
    backgroundColor: BRAND.RED, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryTxt: { color: '#fff', fontFamily: FONTS.SEMIBOLD, fontSize: 15 },
});
