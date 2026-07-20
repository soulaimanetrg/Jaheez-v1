import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BRAND, FONTS } from '@/constants/brand';
import { AuthScreenShell, AuthTextField, InlineNotice, PrimaryButton } from '@/features/auth/components/AuthPrimitives';
import { normalizeMoroccanPhone, routeForCustomer, signInWithEmailPassword, signInWithPhonePassword } from '@/features/auth/services/authApi';
import { useAuthStore } from '@/store/authStore';
import { useLangStore } from '@/store/languageStore';

const COPY = {
  fr: { title: 'Connexion', subtitle: 'Connectez-vous avec votre numero et votre mot de passe.', phone: 'Numero de telephone', password: 'Mot de passe', submit: 'Se connecter', new: 'Nouveau sur Jaheez ?', register: 'Creer un compte', invalidPhone: 'Entrez un numero marocain valide.', missingPassword: 'Entrez votre mot de passe.', failed: 'Numero ou mot de passe incorrect.' },
  en: { title: 'Sign in', subtitle: 'Sign in with your phone number and password.', phone: 'Phone number', password: 'Password', submit: 'Sign in', new: 'New to Jaheez?', register: 'Create account', invalidPhone: 'Enter a valid Moroccan phone number.', missingPassword: 'Enter your password.', failed: 'Phone number or password is incorrect.' },
  ar: { title: 'تسجيل الدخول', subtitle: 'سجل الدخول برقم هاتفك وكلمة المرور.', phone: 'رقم الهاتف', password: 'كلمة المرور', submit: 'تسجيل الدخول', new: 'مستخدم جديد في جاهز؟', register: 'إنشاء حساب', invalidPhone: 'أدخل رقم هاتف مغربي صحيح.', missingPassword: 'أدخل كلمة المرور.', failed: 'رقم الهاتف أو كلمة المرور غير صحيحة.' },
} as const;

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore(s => s.setUser);
  const { lang, isRTL } = useLangStore();
  const c = COPY[lang];
  const [mode,setMode]=useState<'phone'|'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email,setEmail]=useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if(mode==='phone'){try { normalizeMoroccanPhone(phone); } catch { return setError(c.invalidPhone); }}
    if(mode==='email'&&!/^\S+@\S+\.\S+$/.test(email.trim()))return setError(lang==='ar'?'أدخل بريدا إلكترونيا صحيحا.':lang==='en'?'Enter a valid email address.':'Entrez une adresse email valide.');
    if (!password) return setError(c.missingPassword);
    setLoading(true);
    setError('');
    const result = mode==='phone'?await signInWithPhonePassword(phone,password):await signInWithEmailPassword(email,password);
    setLoading(false);
    if (result.error || !result.data) return setError(c.failed);
    setUser(result.data);
    router.replace(routeForCustomer(result.data) as never);
  }

  return <AuthScreenShell title={c.title} subtitle={c.subtitle} showBack action={<PrimaryButton label={c.submit} loading={loading} disabled={mode==='phone'?!phone||!password:!email||!password} onPress={submit} />}>
    <View style={[s.tabs,isRTL&&s.phoneRtl]}><Pressable style={[s.tab,mode==='phone'&&s.tabActive]} onPress={()=>{setMode('phone');setError('')}}><Text style={[s.tabText,mode==='phone'&&s.tabTextActive]}>{lang==='ar'?'الهاتف':lang==='en'?'Phone':'Telephone'}</Text></Pressable><Pressable style={[s.tab,mode==='email'&&s.tabActive]} onPress={()=>{setMode('email');setError('')}}><Text style={[s.tabText,mode==='email'&&s.tabTextActive]}>{lang==='ar'?'البريد الإلكتروني':lang==='en'?'Email':'Email'}</Text></Pressable></View>
    {mode==='phone'?<><Text style={[s.label, isRTL && s.right]}>{c.phone}</Text>
    <View style={[s.phone, isRTL && s.phoneRtl]}>
      <View style={[s.prefix, isRTL ? s.prefixRtl : s.prefixLtr]}><Text style={s.prefixText}>+212</Text></View>
      <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" placeholder="6 XX XX XX XX" placeholderTextColor={BRAND.TEXT3} style={[s.phoneInput, isRTL ? s.inputRtl : s.inputLtr]} />
    </View></>:<AuthTextField label={lang==='ar'?'البريد الإلكتروني':lang==='en'?'Email address':'Adresse email'} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" forceLTR/>}
    <View style={s.password}><AuthTextField label={c.password} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" forceLTR onSubmitEditing={submit} /></View>
    {error ? <InlineNotice text={error} tone="error" /> : null}
    <View style={[s.switchRow, isRTL && s.phoneRtl]}><Text style={s.switchText}>{c.new}</Text><Pressable onPress={() => router.push('/(auth)/register')} hitSlop={8}><Text style={s.switchLink}>{c.register}</Text></Pressable></View>
  </AuthScreenShell>;
}

const s = StyleSheet.create({ tabs:{height:48,flexDirection:'row',padding:4,borderRadius:14,backgroundColor:BRAND.LIGHT,marginBottom:22},tab:{flex:1,alignItems:'center',justifyContent:'center',borderRadius:11},tabActive:{backgroundColor:BRAND.RED},tabText:{fontFamily:FONTS.SEMIBOLD,fontSize:13,color:BRAND.TEXT2},tabTextActive:{color:'#fff'},label:{fontFamily:FONTS.SEMIBOLD,fontSize:13,color:BRAND.TEXT2,marginBottom:8},right:{textAlign:'right'},phone:{height:58,flexDirection:'row'},phoneRtl:{flexDirection:'row-reverse'},prefix:{width:82,borderWidth:1,borderColor:BRAND.INPUT_BORDER,backgroundColor:BRAND.LIGHT,alignItems:'center',justifyContent:'center'},prefixLtr:{borderRightWidth:0,borderTopLeftRadius:16,borderBottomLeftRadius:16},prefixRtl:{borderLeftWidth:0,borderTopRightRadius:16,borderBottomRightRadius:16},prefixText:{fontFamily:FONTS.SEMIBOLD,fontSize:16,color:BRAND.TEXT},phoneInput:{flex:1,borderWidth:1,borderColor:BRAND.INPUT_BORDER,backgroundColor:'#fff',paddingHorizontal:16,fontFamily:FONTS.BODY,fontSize:17,color:BRAND.TEXT,writingDirection:'ltr'},inputLtr:{borderTopRightRadius:16,borderBottomRightRadius:16,textAlign:'left'},inputRtl:{borderTopLeftRadius:16,borderBottomLeftRadius:16,textAlign:'left'},password:{marginTop:22},switchRow:{marginTop:24,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:6,flexWrap:'wrap'},switchText:{fontFamily:FONTS.BODY,fontSize:14,color:BRAND.TEXT2},switchLink:{fontFamily:FONTS.SEMIBOLD,fontSize:14,color:BRAND.RED} });
