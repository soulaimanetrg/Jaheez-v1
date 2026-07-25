import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { ASSETS } from '@/constants/assets';
import { BRAND, FONTS } from '@/constants/brand';
import { authCopy } from '@/features/auth/authCopy';
import { useLangStore } from '@/store/languageStore';

type AuthScreenShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  actionLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  onBack?: () => void;
  showBack?: boolean;
  backFallback?: string;
  progress?: number;
  showHero?: boolean;
};

export function AuthScreenShell({
  title,
  subtitle,
  children,
  action,
  actionLabel,
  loading = false,
  disabled = false,
  onBack,
  showBack = true,
  backFallback = '/(auth)/login',
  progress,
  showHero = false,
}: AuthScreenShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isRTL, lang } = useLangStore();
  const copy = authCopy(lang);
  const compactHero = showBack || progress !== undefined;
  const heroProgress = useRef(new Animated.Value(compactHero ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(heroProgress, {
      toValue: compactHero ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [compactHero, heroProgress]);

  const goBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) return router.back();
    router.replace((pathname.endsWith('/login') ? '/(auth)/welcome' : backFallback) as never);
  };

  useEffect(() => {
    if (Platform.OS !== 'android' || !showBack) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [pathname, showBack, onBack]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.top, isRTL && directionStyles.rowReverse]}>
          {showBack && (
            <Pressable
              style={styles.back}
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel={copy.back}
              hitSlop={8}
            >
              <AppIcon name={isRTL ? 'chevron-forward' : 'chevron-back'} color={BRAND.TEXT} />
            </Pressable>
          )}
          {progress !== undefined && (
            <View style={styles.progress}>
              <View style={[styles.progressFill, { width: `${Math.max(8, progress * 100)}%` }]} />
            </View>
          )}
        </View>

        {showHero && (
          <Animated.View style={[
            styles.hero,
            {
              height: heroProgress.interpolate({ inputRange: [0, 1], outputRange: [210, 118] }),
              marginHorizontal: heroProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 24] }),
              borderRadius: heroProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 24] }),
            },
          ]}>
            <Animated.Image
              source={ASSETS.illustrations.jaheez_scooter_gift}
              style={[
                styles.heroImage,
                { transform: [{ scale: heroProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.77] }) }] },
              ]}
              resizeMode="contain"
              accessibilityLabel="JAHEEZ delivery illustration"
            />
          </Animated.View>
        )}

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, isRTL && directionStyles.right]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, isRTL && directionStyles.right]}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
        </ScrollView>

        {(action || actionLabel) && (
          <View style={styles.footer}>
            {action || <PrimaryButton label={actionLabel!} loading={loading} disabled={disabled} />}
            <Text style={[styles.legal, isRTL && directionStyles.right]}>{copy.terms}</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  color?: string;
  icon?: string;
};

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  color = BRAND.RED,
  icon,
}: PrimaryButtonProps) {
  const isRTL = useLangStore(state => state.isRTL);
  const enabledProgress = useRef(new Animated.Value(disabled ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(enabledProgress, {
      toValue: disabled ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [disabled, enabledProgress]);

  const backgroundColor = enabledProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [BRAND.DISABLED, color],
  });

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [styles.primary, isRTL && directionStyles.rowReverse, pressed && styles.pressed]}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor }]} />
      {loading ? (
        <ActivityIndicator color={BRAND.SURFACE} />
      ) : (
        <>
          {icon ? <AppIcon name={icon} size={21} color={BRAND.SURFACE} /> : null}
          <Text style={[styles.primaryText, isRTL && directionStyles.right]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: string }) {
  const isRTL = useLangStore(state => state.isRTL);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.secondary, isRTL && directionStyles.rowReverse, pressed && styles.pressed]}
    >
      {icon ? <AppIcon name={icon} size={21} color={BRAND.TEXT} /> : null}
      <Text style={[styles.secondaryText, isRTL && directionStyles.right]}>{label}</Text>
    </Pressable>
  );
}

type AuthTextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  forceLTR?: boolean;
  icon?: string;
};

export function AuthTextField({ label, error, forceLTR: forceLTRProp, icon, style, ...inputProps }: AuthTextFieldProps) {
  const isRTL = useLangStore(state => state.isRTL);
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isPassword = Boolean(inputProps.secureTextEntry);
  const forceLTR = Boolean(forceLTRProp || isPassword || inputProps.keyboardType === 'email-address' || inputProps.keyboardType === 'phone-pad');

  return (
    <View style={styles.field}>
      <Text style={[styles.label, isRTL && directionStyles.right]}>{label}</Text>
      <View style={[fieldStyles.frame, isRTL && !forceLTR && directionStyles.rowReverse, focused && fieldStyles.focus, error && fieldStyles.error]}>
        {icon ? <AppIcon name={icon} size={20} color={focused ? BRAND.RED : BRAND.TEXT3} style={fieldStyles.leadingIcon} /> : null}
        <TextInput
          {...inputProps}
          secureTextEntry={isPassword && !revealed}
          onFocus={event => { setFocused(true); inputProps.onFocus?.(event); }}
          onBlur={event => { setFocused(false); inputProps.onBlur?.(event); }}
          placeholderTextColor={BRAND.TEXT3}
          style={[styles.input, fieldStyles.textInput, isRTL && !forceLTR ? directionStyles.rtlInput : directionStyles.ltrInput, style]}
        />
        {isPassword && (
          <Pressable
            style={fieldStyles.reveal}
            onPress={() => setRevealed(value => !value)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            <AppIcon name={revealed ? 'eye-off-outline' : 'eye-outline'} size={20} color={BRAND.TEXT2} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={[styles.error, isRTL && directionStyles.right]}>{error}</Text> : null}
    </View>
  );
}

export function InlineNotice({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'error' | 'success' }) {
  const isRTL = useLangStore(state => state.isRTL);
  return (
    <View style={[styles.notice, isRTL && directionStyles.rowReverse, tone === 'error' && styles.noticeError, tone === 'success' && styles.noticeSuccess]}>
      <AppIcon
        name={tone === 'error' ? 'alert-circle-outline' : tone === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline'}
        size={19}
        color={tone === 'error' ? BRAND.ERROR : tone === 'success' ? BRAND.GREEN : BRAND.TEXT2}
      />
      <Text style={[styles.noticeText, isRTL && directionStyles.right]}>{text}</Text>
    </View>
  );
}

export function VerifiedContactRow({ phone }: { phone: string }) {
  const isRTL = useLangStore(state => state.isRTL);
  return (
    <View style={[styles.verified, isRTL && directionStyles.rowReverse]}>
      <AppIcon name="logo-whatsapp" size={20} color={BRAND.WHATSAPP} />
      <View style={styles.flex}>
        <Text style={[styles.verifiedLabel, isRTL && directionStyles.right]}>WhatsApp</Text>
        <Text style={[styles.verifiedPhone, directionStyles.ltrInput]}>{phone}</Text>
      </View>
      <AppIcon name="checkmark-circle" size={21} color={BRAND.GREEN} />
    </View>
  );
}

export function OtpCodeInput({ value, onChange, onComplete, disabled = false, error = false }: { value: string; onChange: (value: string) => void; onComplete?: (value: string) => void; disabled?: boolean; error?: boolean }) {
  const input = useRef<TextInput>(null);
  const completed = useRef('');
  const clean = value.replace(/\D/g, '').slice(0, 6);

  useEffect(() => {
    if (clean.length === 6 && clean !== completed.current) {
      completed.current = clean;
      onComplete?.(clean);
    }
    if (clean.length < 6) completed.current = '';
  }, [clean, onComplete]);

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Six digit verification code" onPress={() => input.current?.focus()} style={styles.otpWrap}>
      <TextInput ref={input} value={clean} onChangeText={next => onChange(next.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} editable={!disabled} autoFocus style={styles.otpHidden} />
      {Array.from({ length: 6 }, (_, index) => (
        <View key={index} style={[styles.otpCell, clean[index] && styles.otpFilled, error && styles.otpError]}>
          <Text style={styles.otpText}>{clean[index] || ''}</Text>
        </View>
      ))}
    </Pressable>
  );
}

const fieldStyles = StyleSheet.create({
  frame: { minHeight: 56, borderWidth: 1, borderColor: BRAND.INPUT_BORDER, borderRadius: 12, backgroundColor: BRAND.LIGHT, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  focus: { borderColor: BRAND.RED, borderWidth: 1.5, backgroundColor: BRAND.SURFACE },
  error: { borderColor: BRAND.ERROR },
  textInput: { flex: 1, borderWidth: 0, backgroundColor: 'transparent' },
  leadingIcon: { marginLeft: 16 },
  reveal: { width: 52, height: 54, alignItems: 'center', justifyContent: 'center' },
});

const directionStyles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  right: { textAlign: 'right', writingDirection: 'rtl' },
  rtlInput: { textAlign: 'right', writingDirection: 'rtl' },
  ltrInput: { textAlign: 'left', writingDirection: 'ltr' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.SURFACE },
  flex: { flex: 1 },
  top: { height: 52, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  progress: { height: 4, backgroundColor: BRAND.LIGHT, borderRadius: 2, flex: 1, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: BRAND.RED, borderRadius: 2 },
  hero: { height: 210, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: BRAND.YELLOW_LIGHT },
  heroImage: { width: '88%', height: '94%' },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
  title: { fontFamily: FONTS.DISPLAY, fontSize: 30, lineHeight: 38, color: BRAND.TEXT },
  subtitle: { fontFamily: FONTS.BODY, fontSize: 15, lineHeight: 23, color: BRAND.TEXT2, marginTop: 8 },
  body: { marginTop: 26 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: BRAND.BORDER, backgroundColor: BRAND.SURFACE },
  legal: { fontFamily: FONTS.BODY, fontSize: 10, lineHeight: 15, textAlign: 'center', color: BRAND.TEXT3, marginTop: 10 },
  primary: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, overflow: 'hidden' },
  primaryText: { fontFamily: FONTS.SEMIBOLD, fontSize: 16, color: BRAND.SURFACE },
  secondary: { height: 56, borderRadius: 16, borderWidth: 1, borderColor: BRAND.BORDER, backgroundColor: BRAND.SURFACE, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  secondaryText: { fontFamily: FONTS.SEMIBOLD, fontSize: 16, color: BRAND.TEXT },
  pressed: { opacity: 0.82 },
  field: { marginBottom: 18 },
  label: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT2, marginBottom: 8 },
  input: { minHeight: 56, paddingHorizontal: 16, fontFamily: FONTS.BODY, fontSize: 16, color: BRAND.TEXT },
  error: { fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.ERROR, marginTop: 6 },
  notice: { minHeight: 48, borderRadius: 12, backgroundColor: BRAND.LIGHT, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  noticeError: { backgroundColor: BRAND.RED_LIGHT },
  noticeSuccess: { backgroundColor: BRAND.LIGHT },
  noticeText: { fontFamily: FONTS.BODY, fontSize: 13, lineHeight: 19, color: BRAND.TEXT2, flex: 1 },
  verified: { height: 64, borderRadius: 14, backgroundColor: BRAND.LIGHT, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  verifiedLabel: { fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: BRAND.GREEN },
  verifiedPhone: { fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT2, marginTop: 2 },
  otpWrap: { height: 64, flexDirection: 'row', gap: 8, position: 'relative' },
  otpHidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  otpCell: { flex: 1, maxWidth: 52, height: 60, borderRadius: 14, borderWidth: 1.5, borderColor: BRAND.INPUT_BORDER, backgroundColor: BRAND.SURFACE, alignItems: 'center', justifyContent: 'center' },
  otpFilled: { borderColor: BRAND.GREEN, backgroundColor: BRAND.LIGHT },
  otpError: { borderColor: BRAND.ERROR },
  otpText: { fontFamily: FONTS.DISPLAY, fontSize: 23, color: BRAND.TEXT },
});
