import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { BRAND, FONTS } from '@/constants/brand';
import { useLangStore } from '@/lib/i18n';
import { driverApi } from '@/lib/api';
import { useDriverStore } from '@/store/driverStore';

export function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang } = useLangStore();
  const isRTL = lang === 'ar';
  const driver = useDriverStore(s => s.driver);
  const setDriver = useDriverStore(s => s.setDriver);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setErrorMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg(isRTL ? 'يرجى ملء جميع الحقول.' : 'Veuillez remplir tous les champs.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg(isRTL ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.' : 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(isRTL ? 'كلمتا المرور غير متطابقتين.' : 'Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await driverApi.changePassword({ currentPassword, newPassword, confirmPassword });
      Alert.alert(
        isRTL ? 'نجاح' : 'Succès',
        isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Le mot de passe a été modifié avec succès.',
        [{ text: isRTL ? 'موافق' : 'OK', onPress: () => { if (driver) setDriver({ ...driver, must_change_password: false }); router.replace('/(tabs)'); } }]
      );
    } catch (e: any) {
      setErrorMsg(e.message || (isRTL ? 'حدث خطأ ما' : 'Une erreur est survenue.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: BRAND.BG }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => router.back()}
            accessibilityLabel="رجوع"
          >
            <AppIcon name="arrow-back" size={20} color={BRAND.TEXT} />
          </Pressable>
          <Text style={styles.headerTitle}>{t.changePassword || 'Modifier le mot de passe'}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {errorMsg && (
            <View style={styles.errorBanner}>
              <AppIcon name="alert-circle" size={16} color={BRAND.ERROR} />
              <Text style={[styles.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>{errorMsg}</Text>
            </View>
          )}

          {/* Current Password */}
          <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'كلمة المرور الحالية' : 'Mot de passe actuel'}
          </Text>
          <View style={[styles.inputWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <AppIcon name="lock-closed-outline" size={18} color={BRAND.TEXT3} />
            <TextInput
              style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'أدخل كلمة المرور الحالية' : 'Entrez votre mot de passe actuel'}
              placeholderTextColor={BRAND.TEXT3}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              editable={!loading}
            />
          </View>

          {/* New Password */}
          <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
          </Text>
          <View style={[styles.inputWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <AppIcon name="lock-open-outline" size={18} color={BRAND.TEXT3} />
            <TextInput
              style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? '8 أحرف على الأقل' : 'Au moins 8 caractères'}
              placeholderTextColor={BRAND.TEXT3}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!loading}
            />
          </View>

          {/* Confirm Password */}
          <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'تأكيد كلمة المرور الجديدة' : 'Confirmer le mot de passe'}
          </Text>
          <View style={[styles.inputWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <AppIcon name="shield-checkmark-outline" size={18} color={BRAND.TEXT3} />
            <TextInput
              style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'أعد إدخال كلمة المرور' : 'Confirmez le mot de passe'}
              placeholderTextColor={BRAND.TEXT3}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={loading}
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>{t.save || 'Enregistrer'}</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.BORDER,
    backgroundColor: BRAND.SURFACE,
  },
  headerTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 18,
    color: BRAND.TEXT,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.ERROR,
    flex: 1,
  },
  fieldLabel: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.TEXT2,
    marginBottom: 8,
    marginTop: 12,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: BRAND.SURFACE,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: BRAND.BORDER,
    gap: 10,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.BODY,
    fontSize: 14,
    color: BRAND.TEXT,
    height: '100%',
  },
  saveBtn: {
    backgroundColor: BRAND.RED,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: BRAND.RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 16,
    color: '#FFF',
  },
});
