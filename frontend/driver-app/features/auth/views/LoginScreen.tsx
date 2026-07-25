import { AppIcon } from '@/components/ui/AppIcon';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, KeyRound } from 'lucide-react-native';
import { BRAND, FONTS } from '@/constants/brand';
import { driverApi, tokenStore } from '@/lib/api';
import { useDriverStore } from '@/store/driverStore';
import { usePlatformStore } from '@/store/platformStore';

const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;
const sanitizeCin = (input: string) => input.replace(CONTROL_CHARS, '').trim().toUpperCase();

export function LoginScreen() {
  const router = useRouter();
  const setDriver = useDriverStore((state) => state.setDriver);
  const support = usePlatformStore((state) => state.settings?.support_phone_e164);
  const [cin, setCin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login() {
    const cleanCin = sanitizeCin(cin);
    setError(null);
    if (cleanCin.length < 3) {
      setError('CIN requis.');
      return;
    }
    if (password.length < 8) {
      setError('Mot de passe requis (8 caractères minimum).');
      return;
    }

    setLoading(true);
    try {
      const result = await driverApi.loginDriver(cleanCin, password);
      if (!result.token || !result.driver) throw new Error('Réponse de connexion invalide.');
      await tokenStore.set(result.token);
      setDriver(result.driver);
      setPassword('');
      router.replace(result.driver.must_change_password ? '/(flows)/change-password' : '/(tabs)');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: BRAND.BG }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: BRAND.SURFACE, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BRAND.BORDER }}
          accessibilityLabel="Retour"
        >
          <AppIcon icon={ChevronLeft} size={22} color={BRAND.TEXT} />
        </Pressable>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 22 }}>
        <View style={{ width: 62, height: 62, borderRadius: 17, backgroundColor: BRAND.RED_LIGHT, alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
          <AppIcon icon={KeyRound} size={30} color={BRAND.RED} />
        </View>
        <Text style={{ fontFamily: FONTS.DISPLAY, fontSize: 28, color: BRAND.TEXT, marginBottom: 8 }}>Espace livreur</Text>
        <Text style={{ fontFamily: FONTS.BODY, fontSize: 15, color: BRAND.TEXT2, marginBottom: 30, lineHeight: 22 }}>
          Connectez-vous avec les identifiants fournis par Jaheez.
        </Text>

        <Text style={label}>CIN</Text>
        <TextInput
          value={cin}
          onChangeText={setCin}
          placeholder="AB123456"
          placeholderTextColor={BRAND.TEXT3}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!loading}
          returnKeyType="next"
          style={input}
        />

        <Text style={label}>Mot de passe</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Mot de passe"
          placeholderTextColor={BRAND.TEXT3}
          secureTextEntry
          autoComplete="password"
          editable={!loading}
          returnKeyType="done"
          onSubmitEditing={login}
          style={input}
        />

        <Pressable onPress={() => Alert.alert(
          'Mot de passe oublié',
          support ? `Contactez Jaheez au ${support}.` : "Contactez l'administration Jaheez.",
        )}>
          <Text style={{ color: BRAND.RED, fontFamily: FONTS.SEMIBOLD, fontSize: 13, textAlign: 'right', marginTop: 10 }}>
            Mot de passe oublié ?
          </Text>
        </Pressable>

        {error ? <Text style={{ color: BRAND.ERROR, fontFamily: FONTS.SEMIBOLD, fontSize: 13, marginTop: 16 }}>{error}</Text> : null}

        <Pressable
          onPress={login}
          disabled={loading}
          style={{ marginTop: 28, backgroundColor: BRAND.RED, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', opacity: loading ? 0.6 : 1 }}
        >
          {loading
            ? <ActivityIndicator color={BRAND.SURFACE} />
            : <Text style={{ color: BRAND.SURFACE, fontFamily: FONTS.DISPLAY, fontSize: 16 }}>Se connecter</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const label = { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT2, marginBottom: 8 } as const;
const input = { backgroundColor: BRAND.SURFACE, borderWidth: 1, borderColor: BRAND.BORDER, borderRadius: 12, paddingHorizontal: 16, height: 54, fontFamily: FONTS.BODY, fontSize: 16, color: BRAND.TEXT, marginBottom: 20 } as const;
