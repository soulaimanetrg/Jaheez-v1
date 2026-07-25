import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppIcon } from '@/components/ui/AppIcon';
import { BRAND, FONTS } from '@/constants/brand';
import {
  AuthScreenShell,
  AuthTextField,
  InlineNotice,
  OtpCodeInput,
  PrimaryButton,
} from '@/features/auth/components/AuthPrimitives';
import {
  completeCustomerRegistration,
  continueCustomerAuth,
  normalizeMoroccanPhone,
  resendCustomerRegistrationOtp,
  routeForCustomer,
  signInWithContinuationPassword,
  validateCustomerPassword,
  verifyCustomerRegistrationOtp,
} from '@/features/auth/services/authApi';
import { useAuthStore } from '@/store/authStore';
import { useLangStore, type Lang } from '@/store/languageStore';

type IdentifierMode = 'phone' | 'email';
type AuthStep = 'identifier' | 'password' | 'otp' | 'profile';

const COPY: Record<Lang, {
  welcome: string; subtitle: string; phone: string; email: string;
  phonePlaceholder: string; emailPlaceholder: string; continue: string; passwordTitle: string;
  passwordSub: string; password: string; signIn: string; otpTitle: string; otpSub: (value: string) => string;
  verify: string; resendIn: (seconds: number) => string; resend: string; profileTitle: string;
  profileSub: string; fullName: string; newPassword: string; confirmPassword: string; consent: string;
  create: string; invalidPhone: string; invalidEmail: string; passwordMismatch: string; back: string;
}> = {
  en: {
    welcome: 'Welcome to JAHEEZ', subtitle: 'Sign in to your account or securely create a new one.',
    phone: 'Phone', email: 'Email',
    phonePlaceholder: '6 12 34 56 78', emailPlaceholder: 'name@example.com', continue: 'Continue',
    passwordTitle: 'Enter your password', passwordSub: 'Use the password connected to your JAHEEZ account.',
    password: 'Password', signIn: 'Sign in', otpTitle: 'Verify your contact',
    otpSub: value => `Enter the 6-digit code sent to ${value}.`, verify: 'Verify code',
    resendIn: seconds => `Resend code in ${seconds}s`, resend: 'Resend code', profileTitle: 'Create your account',
    profileSub: 'Your contact is verified. Add your name and choose a secure password.', fullName: 'Full name',
    newPassword: 'Password', confirmPassword: 'Confirm password', consent: 'I agree to the Terms of Service and Privacy Policy.',
    create: 'Create account', invalidPhone: 'Enter a valid Moroccan number beginning with 06 or 07.',
    invalidEmail: 'Enter a valid email address.', passwordMismatch: 'The passwords do not match.', back: 'Back',
  },
  fr: {
    welcome: 'Bienvenue sur JAHEEZ', subtitle: 'Connectez-vous ou créez un nouveau compte de manière sécurisée.',
    phone: 'Téléphone', email: 'E-mail',
    phonePlaceholder: '6 12 34 56 78', emailPlaceholder: 'nom@exemple.com', continue: 'Continuer',
    passwordTitle: 'Saisissez votre mot de passe', passwordSub: 'Utilisez le mot de passe associé à votre compte JAHEEZ.',
    password: 'Mot de passe', signIn: 'Se connecter', otpTitle: 'Vérifiez votre contact',
    otpSub: value => `Saisissez le code à 6 chiffres envoyé à ${value}.`, verify: 'Vérifier le code',
    resendIn: seconds => `Renvoyer le code dans ${seconds}s`, resend: 'Renvoyer le code', profileTitle: 'Créez votre compte',
    profileSub: 'Votre contact est vérifié. Ajoutez votre nom et choisissez un mot de passe sécurisé.', fullName: 'Nom complet',
    newPassword: 'Mot de passe', confirmPassword: 'Confirmer le mot de passe', consent: "J’accepte les Conditions d’utilisation et la Politique de confidentialité.",
    create: 'Créer mon compte', invalidPhone: 'Saisissez un numéro marocain valide commençant par 06 ou 07.',
    invalidEmail: 'Saisissez une adresse e-mail valide.', passwordMismatch: 'Les mots de passe ne correspondent pas.', back: 'Retour',
  },
  ar: {
    welcome: 'مرحباً بك في جاهز', subtitle: 'سجّل الدخول إلى حسابك أو أنشئ حساباً جديداً بشكل آمن.',
    phone: 'الهاتف', email: 'البريد الإلكتروني',
    phonePlaceholder: '6 12 34 56 78', emailPlaceholder: 'name@example.com', continue: 'متابعة',
    passwordTitle: 'أدخل كلمة المرور', passwordSub: 'استخدم كلمة المرور المرتبطة بحسابك في جاهز.',
    password: 'كلمة المرور', signIn: 'تسجيل الدخول', otpTitle: 'تحقق من وسيلة الاتصال',
    otpSub: value => `أدخل الرمز المكوّن من 6 أرقام المرسل إلى ${value}.`, verify: 'تحقق من الرمز',
    resendIn: seconds => `إعادة إرسال الرمز خلال ${seconds}ث`, resend: 'إعادة إرسال الرمز', profileTitle: 'أنشئ حسابك',
    profileSub: 'تم التحقق من وسيلة الاتصال. أضف اسمك واختر كلمة مرور آمنة.', fullName: 'الاسم الكامل',
    newPassword: 'كلمة المرور', confirmPassword: 'تأكيد كلمة المرور', consent: 'أوافق على شروط الخدمة وسياسة الخصوصية.',
    create: 'إنشاء الحساب', invalidPhone: 'أدخل رقماً مغربياً صحيحاً يبدأ بـ 06 أو 07.',
    invalidEmail: 'أدخل بريداً إلكترونياً صحيحاً.', passwordMismatch: 'كلمتا المرور غير متطابقتين.', back: 'رجوع',
  },
};

function formattedPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  return [digits.slice(0, 1), digits.slice(1, 3), digits.slice(3, 5), digits.slice(5, 7), digits.slice(7, 9)]
    .filter(Boolean)
    .join(' ');
}

export function UnifiedAuthScreen() {
  const router = useRouter();
  const setUser = useAuthStore(state => state.setUser);
  const { lang, isRTL } = useLangStore();
  const copy = COPY[lang];
  const transition = useRef(new Animated.Value(0)).current;
  const [step, setStep] = useState<AuthStep>('identifier');
  const [mode, setMode] = useState<IdentifierMode>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [passwordChallengeToken, setPasswordChallengeToken] = useState('');
  const [registrationProof, setRegistrationProof] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  let phoneValid = false;
  try { normalizeMoroccanPhone(phone); phoneValid = true; } catch { phoneValid = false; }
  const identifierValid = mode === 'phone' ? phoneValid : emailValid;
  const profilePasswordError = validateCustomerPassword(password);
  const profileValid = fullName.trim().length >= 2 && !profilePasswordError && password === confirmPassword && consent;
  const identifierDisplay = mode === 'phone' ? `+212 ${formattedPhone(phone)}` : email.trim().toLowerCase();

  useEffect(() => {
    if (step !== 'otp') return;
    const interval = setInterval(() => setSecondsRemaining(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(interval);
  }, [step]);

  const animateTo = (next: AuthStep, direction: 1 | -1 = 1) => {
    Animated.timing(transition, { toValue: -direction, duration: 150, useNativeDriver: true }).start(() => {
      setStep(next);
      setError('');
      transition.setValue(direction);
      Animated.timing(transition, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    });
  };

  const submitIdentifier = async () => {
    if (!identifierValid) return setError(mode === 'phone' ? copy.invalidPhone : copy.invalidEmail);
    setLoading(true);
    setError('');
    const result = await continueCustomerAuth(mode === 'phone' ? { phone } : { email });
    setLoading(false);
    if (result.error || !result.data) return setError(result.error || 'Authentication is temporarily unavailable.');
    if (result.data.continuation === 'password_challenge') {
      setPasswordChallengeToken(result.data.continuation_token);
      return animateTo('password');
    }
    setChallengeToken(result.data.challenge_token);
    setSecondsRemaining(result.data.resend_after_seconds);
    animateTo('otp');
  };

  const submitLogin = async () => {
    if (!password || !passwordChallengeToken) return;
    setLoading(true);
    setError('');
    const result = await signInWithContinuationPassword(passwordChallengeToken, password);
    setLoading(false);
    if (result.error || !result.data) return setError(result.error || 'Invalid credentials.');
    setUser(result.data);
    router.replace(routeForCustomer(result.data) as never);
  };

  const submitOtp = async () => {
    if (otp.length !== 6 || !challengeToken) return;
    if (registrationProof) return animateTo('profile');
    setLoading(true);
    setError('');
    const result = await verifyCustomerRegistrationOtp(challengeToken, otp);
    setLoading(false);
    if (result.error || !result.data) return setError(result.error || 'The code is invalid or expired.');
    setRegistrationProof(result.data.registration_proof);
    animateTo('profile');
  };

  const resendOtp = async () => {
    if (!challengeToken || registrationProof || secondsRemaining > 0) return;
    setLoading(true);
    setError('');
    const result = await resendCustomerRegistrationOtp(challengeToken);
    setLoading(false);
    if (result.error || !result.data) return setError(result.error || 'Unable to resend the code.');
    setOtp('');
    setSecondsRemaining(result.data.resend_after_seconds);
  };

  const submitRegistration = async () => {
    if (!profileValid || !registrationProof) {
      if (confirmPassword && password !== confirmPassword) setError(copy.passwordMismatch);
      return;
    }
    setLoading(true);
    setError('');
    const result = await completeCustomerRegistration({
      registrationProof,
      fullName,
      password,
      language: lang,
    });
    setLoading(false);
    if (result.error || !result.data) return setError(result.error || 'Unable to create the account.');
    setUser(result.data);
    router.replace(routeForCustomer(result.data) as never);
  };

  const goBack = () => {
    if (step === 'profile') return animateTo('otp', -1);
    if (step === 'otp' || step === 'password') return animateTo('identifier', -1);
  };

  const action = step === 'identifier'
    ? <PrimaryButton label={copy.continue} loading={loading} disabled={!identifierValid} onPress={submitIdentifier} />
    : step === 'password'
      ? <PrimaryButton label={copy.signIn} loading={loading} disabled={!password} onPress={submitLogin} />
      : step === 'otp'
        ? <PrimaryButton label={copy.verify} loading={loading} disabled={otp.length !== 6} onPress={submitOtp} />
        : <PrimaryButton label={copy.create} loading={loading} disabled={!profileValid} onPress={submitRegistration} />;

  const stepHeading = step === 'password' ? { title: copy.passwordTitle, subtitle: copy.passwordSub }
      : step === 'otp' ? { title: copy.otpTitle, subtitle: copy.otpSub(identifierDisplay) }
        : { title: copy.profileTitle, subtitle: copy.profileSub };

  const animatedStyle = {
    opacity: transition.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
    transform: [{ translateX: transition.interpolate({ inputRange: [-1, 0, 1], outputRange: [-24, 0, 24] }) }],
  };

  return (
    <AuthScreenShell
      title={copy.welcome}
      subtitle={copy.subtitle}
      showBack={step !== 'identifier'}
      onBack={goBack}
      showHero
      action={action}
    >
      <Animated.View style={animatedStyle}>
        {step !== 'identifier' ? (
          <View style={styles.stepHeading}>
            <Text style={[styles.stepTitle, isRTL && styles.textRTL]}>{stepHeading.title}</Text>
            <Text style={[styles.stepSubtitle, isRTL && styles.textRTL]}>{stepHeading.subtitle}</Text>
          </View>
        ) : null}
        {step === 'identifier' ? (
          <>
            <View style={[styles.modeTabs, isRTL && styles.rowReverse]}>
              <Pressable accessibilityRole="tab" accessibilityLabel={copy.phone} accessibilityState={{ selected: mode === 'phone' }} onPress={() => { setMode('phone'); setError(''); }} style={[styles.modeTab, mode === 'phone' && styles.modeTabActive]}>
                <AppIcon name="call-outline" size={18} color={mode === 'phone' ? BRAND.RED : BRAND.TEXT2} active={mode === 'phone'} />
                <Text style={[styles.modeText, mode === 'phone' && styles.modeTextActive]}>{copy.phone}</Text>
              </Pressable>
              <Pressable accessibilityRole="tab" accessibilityLabel={copy.email} accessibilityState={{ selected: mode === 'email' }} onPress={() => { setMode('email'); setError(''); }} style={[styles.modeTab, mode === 'email' && styles.modeTabActive]}>
                <AppIcon name="mail-outline" size={18} color={mode === 'email' ? BRAND.RED : BRAND.TEXT2} active={mode === 'email'} />
                <Text style={[styles.modeText, mode === 'email' && styles.modeTextActive]}>{copy.email}</Text>
              </Pressable>
            </View>
            {mode === 'phone' ? (
              <View style={styles.phoneFrame}>
                <View style={styles.countryCode} accessibilityLabel="Morocco country code plus 212">
                  <Text style={styles.flag}>🇲🇦</Text><Text style={styles.prefix}>+212</Text>
                </View>
                <TextInput
                  accessibilityLabel={copy.phone}
                  value={formattedPhone(phone)}
                  onChangeText={value => { setPhone(value.replace(/\D/g, '').slice(0, 9)); setError(''); }}
                  placeholder={copy.phonePlaceholder}
                  placeholderTextColor={BRAND.TEXT3}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  maxLength={13}
                  style={styles.phoneInput}
                />
              </View>
            ) : (
              <AuthTextField label={copy.email} icon="mail-outline" value={email} onChangeText={value => { setEmail(value); setError(''); }} placeholder={copy.emailPlaceholder} keyboardType="email-address" autoCapitalize="none" autoComplete="email" forceLTR />
            )}
          </>
        ) : null}

        {step === 'password' ? (
          <AuthTextField label={copy.password} icon="lock-closed-outline" value={password} onChangeText={value => { setPassword(value); setError(''); }} secureTextEntry autoComplete="current-password" forceLTR autoFocus onSubmitEditing={submitLogin} />
        ) : null}

        {step === 'otp' ? (
          <View>
            <OtpCodeInput value={otp} onChange={value => { setOtp(value); setError(''); }} disabled={loading} />
            <View style={styles.resendArea}>
              {secondsRemaining > 0 ? <Text style={styles.resendTimer}>{copy.resendIn(secondsRemaining)}</Text> : (
                <Pressable accessibilityRole="button" accessibilityLabel={copy.resend} onPress={resendOtp} disabled={loading} style={styles.resendButton}>
                  <Text style={styles.resendLink}>{copy.resend}</Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : null}

        {step === 'profile' ? (
          <View>
            <AuthTextField label={copy.fullName} icon="person-outline" value={fullName} onChangeText={value => { setFullName(value); setError(''); }} autoComplete="name" autoFocus />
            <AuthTextField label={copy.newPassword} icon="lock-closed-outline" value={password} onChangeText={value => { setPassword(value); setError(''); }} secureTextEntry autoComplete="new-password" forceLTR error={password ? profilePasswordError || undefined : undefined} />
            <AuthTextField label={copy.confirmPassword} icon="shield-checkmark-outline" value={confirmPassword} onChangeText={value => { setConfirmPassword(value); setError(''); }} secureTextEntry autoComplete="new-password" forceLTR error={confirmPassword && password !== confirmPassword ? copy.passwordMismatch : undefined} />
            <Pressable accessibilityRole="checkbox" accessibilityLabel={copy.consent} accessibilityState={{ checked: consent }} onPress={() => setConsent(value => !value)} style={[styles.consentRow, isRTL && styles.rowReverse]}>
              <View style={[styles.checkbox, consent && styles.checkboxChecked]}>{consent ? <AppIcon name="checkmark" size={17} color={BRAND.SURFACE} active /> : null}</View>
              <Text style={[styles.consentText, isRTL && styles.textRTL]}>{copy.consent}</Text>
            </Pressable>
          </View>
        ) : null}

        {error ? <View style={styles.errorGap}><InlineNotice text={error} tone="error" /></View> : null}
      </Animated.View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  stepHeading: { marginBottom: 20 },
  stepTitle: { fontFamily: FONTS.SEMIBOLD, fontSize: 20, lineHeight: 28, color: BRAND.TEXT },
  stepSubtitle: { marginTop: 6, fontFamily: FONTS.BODY, fontSize: 14, lineHeight: 21, color: BRAND.TEXT2 },
  modeTabs: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  modeTab: { minHeight: 44, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: BRAND.BORDER, flexDirection: 'row', alignItems: 'center', gap: 7 },
  modeTabActive: { borderColor: BRAND.RED, backgroundColor: BRAND.RED_LIGHT },
  modeText: { fontFamily: FONTS.MEDIUM, fontSize: 13, color: BRAND.TEXT2 },
  modeTextActive: { color: BRAND.RED },
  phoneFrame: { height: 56, borderRadius: 12, borderWidth: 1, borderColor: BRAND.INPUT_BORDER, backgroundColor: BRAND.LIGHT, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  countryCode: { height: 54, paddingHorizontal: 13, borderRightWidth: 1, borderRightColor: BRAND.BORDER, flexDirection: 'row', alignItems: 'center', gap: 7 },
  flag: { fontSize: 20 },
  prefix: { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.TEXT },
  phoneInput: { flex: 1, height: 54, paddingHorizontal: 14, fontFamily: FONTS.BODY, fontSize: 16, color: BRAND.TEXT, textAlign: 'left', writingDirection: 'ltr' },
  resendArea: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  resendTimer: { fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT2 },
  resendButton: { minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  resendLink: { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.BLUE },
  consentRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: BRAND.INPUT_BORDER, backgroundColor: BRAND.SURFACE, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { borderColor: BRAND.RED, backgroundColor: BRAND.RED },
  consentText: { flex: 1, fontFamily: FONTS.BODY, fontSize: 13, lineHeight: 20, color: BRAND.TEXT2 },
  errorGap: { marginTop: 16 },
  rowReverse: { flexDirection: 'row-reverse' },
  textRTL: { textAlign: 'right', writingDirection: 'rtl' },
});
