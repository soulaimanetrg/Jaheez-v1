import { Image,StyleSheet,Text,View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ASSETS } from '@/constants/assets';
import { BRAND,FONTS } from '@/constants/brand';
import { PrimaryButton } from '@/features/auth/components/AuthPrimitives';
import { authCopy } from '@/features/auth/authCopy';
import { markWelcomeSeen } from '@/features/auth/welcomeState';
import { useLangStore } from '@/store/languageStore';

export default function Welcome(){const router=useRouter(),lang=useLangStore(s=>s.lang),rtl=useLangStore(s=>s.isRTL),c=authCopy(lang);async function start(){await markWelcomeSeen();router.replace('/(auth)/login')}
return <SafeAreaView style={s.root}><View style={s.brandRow}><Image source={ASSETS.branding.logo_custom} style={s.logo} resizeMode="contain"/><Text style={s.brand}>JAHEEZ</Text></View><View style={s.art}><Image source={ASSETS.illustrations.jaheez_scooter_large} style={s.image} resizeMode="contain"/></View><View style={s.copy}><Text style={[s.title,rtl&&s.right]}>{c.welcome}</Text><Text style={[s.sub,rtl&&s.right]}>{c.welcomeSub}</Text></View><View style={s.footer}><PrimaryButton label={c.start} onPress={start}/></View></SafeAreaView>}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#FFFEFA'},brandRow:{height:70,paddingHorizontal:24,flexDirection:'row',alignItems:'center',gap:9},logo:{width:34,height:34},brand:{fontFamily:FONTS.DISPLAY,fontSize:18,color:BRAND.RED},art:{flex:1,minHeight:250,backgroundColor:BRAND.YELLOW_LIGHT,alignItems:'center',justifyContent:'center',overflow:'hidden'},image:{width:'92%',height:'92%'},copy:{paddingHorizontal:24,paddingTop:28},title:{fontFamily:FONTS.DISPLAY,fontSize:34,lineHeight:42,color:BRAND.TEXT,maxWidth:360},sub:{fontFamily:FONTS.BODY,fontSize:16,lineHeight:24,color:BRAND.TEXT2,marginTop:10},right:{textAlign:'right'},footer:{padding:24,paddingTop:20}});
