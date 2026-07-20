import { Modal,Pressable,StyleSheet,Text,View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Ionicons';
import { BRAND,FONTS } from '@/constants/brand';

export function RequireAuthSheet({visible,next,onClose}:{visible:boolean;next:string;onClose:()=>void}){
  const router=useRouter();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={()=>router.replace('/(auth)/login')}><View style={s.backdrop}/><View style={s.sheet}><View style={s.handle}/><View style={s.icon}><Ionicons name="shield-checkmark" size={28} color={BRAND.RED}/></View><Text style={s.title}>Connectez-vous pour continuer</Text><Text style={s.sub}>Votre compte protege vos commandes, adresses et conversations avec le support.</Text><Pressable style={s.primary} onPress={()=>router.replace('/(auth)/login')}><Ionicons name="logo-whatsapp" size={20} color="#fff"/><Text style={s.primaryText}>Continuer vers la connexion</Text></Pressable></View></Modal>
}
const s=StyleSheet.create({backdrop:{flex:1,backgroundColor:'rgba(20,20,20,.42)'},sheet:{backgroundColor:BRAND.BG,borderTopLeftRadius:20,borderTopRightRadius:20,paddingHorizontal:24,paddingTop:10,paddingBottom:28},handle:{width:42,height:4,borderRadius:2,backgroundColor:BRAND.BORDER,alignSelf:'center',marginBottom:20},icon:{width:52,height:52,borderRadius:14,backgroundColor:BRAND.RED_LIGHT,alignItems:'center',justifyContent:'center'},title:{fontFamily:FONTS.DISPLAY,fontSize:22,color:BRAND.TEXT,marginTop:16},sub:{fontFamily:FONTS.BODY,fontSize:14,color:BRAND.TEXT2,lineHeight:21,marginTop:7},primary:{height:54,borderRadius:12,backgroundColor:BRAND.RED,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,marginTop:22},primaryText:{fontFamily:FONTS.DISPLAY,fontSize:15,color:'#fff'},secondary:{fontFamily:FONTS.SEMIBOLD,fontSize:14,color:BRAND.TEXT2,textAlign:'center',paddingTop:18}});
