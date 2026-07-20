import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BRAND, FONTS } from '@/constants/brand';
import { AuthScreenShell, AuthTextField, InlineNotice, PrimaryButton } from '@/features/auth/components/AuthPrimitives';
import { normalizeMoroccanPhone, registerWithEmailPassword, registerWithPhonePassword, routeForCustomer, validateCustomerPassword } from '@/features/auth/services/authApi';
import { useAuthStore } from '@/store/authStore';
import { useLangStore } from '@/store/languageStore';

const COPY = {
  fr:{title:'Creer un compte',subtitle:'Quelques informations pour commencer.',name:'Nom complet',phone:'Numero de telephone',password:'Mot de passe',confirm:'Confirmer le mot de passe',submit:'Creer mon compte',existing:'Deja un compte ?',login:'Se connecter',terms:'En creant votre compte, vous acceptez les Conditions et la Politique de confidentialite.',nameError:'Entrez votre nom complet.',phoneError:'Entrez un numero marocain valide.',match:'Les mots de passe ne correspondent pas.',failed:'Creation impossible. Verifiez vos informations ou connectez-vous.'},
  en:{title:'Create account',subtitle:'A few details to get you started.',name:'Full name',phone:'Phone number',password:'Password',confirm:'Confirm password',submit:'Create my account',existing:'Already have an account?',login:'Sign in',terms:'By creating your account, you agree to the Terms and Privacy Policy.',nameError:'Enter your full name.',phoneError:'Enter a valid Moroccan phone number.',match:'Passwords do not match.',failed:'Unable to create account. Check your details or sign in.'},
  ar:{title:'إنشاء حساب',subtitle:'بعض المعلومات للبدء.',name:'الاسم الكامل',phone:'رقم الهاتف',password:'كلمة المرور',confirm:'تأكيد كلمة المرور',submit:'إنشاء حسابي',existing:'لديك حساب بالفعل؟',login:'تسجيل الدخول',terms:'بإنشاء الحساب، أنت توافق على الشروط وسياسة الخصوصية.',nameError:'أدخل اسمك الكامل.',phoneError:'أدخل رقم هاتف مغربي صحيح.',match:'كلمتا المرور غير متطابقتين.',failed:'تعذر إنشاء الحساب. تحقق من المعلومات أو سجل الدخول.'},
} as const;

export default function RegisterScreen(){
  const router=useRouter();
  const setUser=useAuthStore(s=>s.setUser);
  const {lang,isRTL}=useLangStore();
  const c=COPY[lang];
  const[mode,setMode]=useState<'phone'|'email'>('phone');
  const[name,setName]=useState('');
  const[phone,setPhone]=useState('');
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[confirm,setConfirm]=useState('');
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState('');

  async function submit(){
    if(name.trim().length<2)return setError(c.nameError);
    if(mode==='phone'){try{normalizeMoroccanPhone(phone)}catch{return setError(c.phoneError)}}
    if(mode==='email'&&!/^\S+@\S+\.\S+$/.test(email.trim()))return setError(lang==='ar'?'أدخل بريدا إلكترونيا صحيحا.':lang==='en'?'Enter a valid email address.':'Entrez une adresse email valide.');
    const passwordError=validateCustomerPassword(password);if(passwordError)return setError(passwordError);
    if(password!==confirm)return setError(c.match);
    setLoading(true);setError('');
    const result=mode==='phone'?await registerWithPhonePassword({fullName:name.trim(),phone,password,language:lang}):await registerWithEmailPassword({fullName:name.trim(),email,password,language:lang});
    setLoading(false);
    if(result.error||!result.data?.profile)return setError(c.failed);
    setUser(result.data.profile);
    router.replace(routeForCustomer(result.data.profile) as never);
  }

  return <AuthScreenShell title={c.title} subtitle={c.subtitle} backFallback="/(auth)/login" action={<PrimaryButton label={c.submit} loading={loading} disabled={!name||(mode==='phone'?!phone:!email)||!password||!confirm} onPress={submit}/> }>
    <View style={[s.tabs,isRTL&&s.rowReverse]}><Pressable style={[s.tab,mode==='phone'&&s.tabActive]} onPress={()=>{setMode('phone');setError('')}}><Text style={[s.tabText,mode==='phone'&&s.tabTextActive]}>{lang==='ar'?'الهاتف':lang==='en'?'Phone':'Telephone'}</Text></Pressable><Pressable style={[s.tab,mode==='email'&&s.tabActive]} onPress={()=>{setMode('email');setError('')}}><Text style={[s.tabText,mode==='email'&&s.tabTextActive]}>{lang==='ar'?'البريد الإلكتروني':lang==='en'?'Email':'Email'}</Text></Pressable></View>
    <AuthTextField label={c.name} value={name} onChangeText={setName} autoComplete="name" />
    {mode==='phone'?<><Text style={[s.label,isRTL&&s.right]}>{c.phone}</Text>
    <View style={[s.phone,isRTL&&s.rowReverse]}><View style={[s.prefix,isRTL?s.prefixRtl:s.prefixLtr]}><Text style={s.prefixText}>+212</Text></View><TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="6 XX XX XX XX" placeholderTextColor={BRAND.TEXT3} style={[s.phoneInput,isRTL?s.inputRtl:s.inputLtr]}/></View></>:<AuthTextField label={lang==='ar'?'البريد الإلكتروني':lang==='en'?'Email address':'Adresse email'} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" forceLTR/>}
    <View style={s.password}><AuthTextField label={c.password} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" forceLTR/><AuthTextField label={c.confirm} value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" forceLTR onSubmitEditing={submit}/></View>
    <Text style={[s.terms,isRTL&&s.right]}>{c.terms}</Text>
    {error?<InlineNotice text={error} tone="error"/>:null}
    <View style={[s.switchRow,isRTL&&s.rowReverse]}><Text style={s.switchText}>{c.existing}</Text><Pressable onPress={()=>router.replace('/(auth)/login')} hitSlop={8}><Text style={s.switchLink}>{c.login}</Text></Pressable></View>
  </AuthScreenShell>;
}

const s=StyleSheet.create({tabs:{height:48,flexDirection:'row',padding:4,borderRadius:14,backgroundColor:BRAND.LIGHT,marginBottom:22},tab:{flex:1,alignItems:'center',justifyContent:'center',borderRadius:11},tabActive:{backgroundColor:BRAND.RED},tabText:{fontFamily:FONTS.SEMIBOLD,fontSize:13,color:BRAND.TEXT2},tabTextActive:{color:'#fff'},label:{fontFamily:FONTS.SEMIBOLD,fontSize:13,color:BRAND.TEXT2,marginBottom:8},right:{textAlign:'right'},rowReverse:{flexDirection:'row-reverse'},phone:{height:58,flexDirection:'row',marginBottom:20},prefix:{width:82,borderWidth:1,borderColor:BRAND.INPUT_BORDER,backgroundColor:BRAND.LIGHT,alignItems:'center',justifyContent:'center'},prefixLtr:{borderRightWidth:0,borderTopLeftRadius:16,borderBottomLeftRadius:16},prefixRtl:{borderLeftWidth:0,borderTopRightRadius:16,borderBottomRightRadius:16},prefixText:{fontFamily:FONTS.SEMIBOLD,fontSize:16,color:BRAND.TEXT},phoneInput:{flex:1,borderWidth:1,borderColor:BRAND.INPUT_BORDER,backgroundColor:'#fff',paddingHorizontal:16,fontFamily:FONTS.BODY,fontSize:17,color:BRAND.TEXT,writingDirection:'ltr'},inputLtr:{borderTopRightRadius:16,borderBottomRightRadius:16,textAlign:'left'},inputRtl:{borderTopLeftRadius:16,borderBottomLeftRadius:16,textAlign:'left'},password:{marginTop:2},terms:{fontFamily:FONTS.BODY,fontSize:12,lineHeight:19,color:BRAND.TEXT3,marginBottom:16},switchRow:{marginTop:22,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:6,flexWrap:'wrap'},switchText:{fontFamily:FONTS.BODY,fontSize:14,color:BRAND.TEXT2},switchLink:{fontFamily:FONTS.SEMIBOLD,fontSize:14,color:BRAND.RED}});
