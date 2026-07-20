import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { AuthScreenShell, InlineNotice, PrimaryButton, SecondaryButton } from '@/features/auth/components/AuthPrimitives';
import { reverseLocation } from '@/lib/locationApi';
import { useLangStore } from '@/store/languageStore';

export default function LocationScreen(){
  const router=useRouter();const{lang,isRTL}=useLangStore();const[loading,setLoading]=useState(false);const[error,setError]=useState('');
  const text=lang==='ar'?{title:'أين تريد التوصيل؟',sub:'حدد نقطة توصيل دقيقة لعرض الخدمات المتاحة حولك.',gps:'استخدام موقعي الحالي',map:'اختيار الموقع على الخريطة',denied:'يمكنك تفعيل إذن الموقع أو اختيار موقعك على الخريطة.'}:lang==='en'?{title:'Where should we deliver?',sub:'Set an accurate drop-off point to see services available near you.',gps:'Use my current location',map:'Choose on map',denied:'Enable location permission or choose your location on the map.'}:{title:'Ou souhaitez-vous etre livre ?',sub:'Definissez un point de livraison precis pour voir les services disponibles.',gps:'Utiliser ma position',map:'Choisir sur la carte',denied:'Autorisez la localisation ou choisissez votre position sur la carte.'};
  async function useGps(){setLoading(true);setError('');try{const permission=await Location.requestForegroundPermissionsAsync();if(permission.status!=='granted'){setError(text.denied);return;}const point=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});const lat=point.coords.latitude,lng=point.coords.longitude;const resolved=await reverseLocation(lat,lng);router.push({pathname:'/(auth)/confirm-address',params:{lat:String(lat),lng:String(lng),city:resolved?.city||'',address:resolved?.address||'',source:'gps'}});}catch{setError(text.denied)}finally{setLoading(false)}}
  return <AuthScreenShell title={text.title} subtitle={text.sub} showBack={false}><View style={s.art}><Text style={s.pin}>⌖</Text></View><PrimaryButton label={text.gps} loading={loading} onPress={useGps} icon="navigate-outline"/><View style={s.gap}/><SecondaryButton label={text.map} onPress={()=>router.push('/(auth)/map-pin')} icon="map-outline"/>{error?<View style={s.notice}><InlineNotice text={error} tone="error"/><Text style={[s.settings,isRTL&&s.right]} onPress={()=>Linking.openSettings()}>{lang==='ar'?'فتح الإعدادات':lang==='en'?'Open settings':'Ouvrir les reglages'}</Text></View>:null}</AuthScreenShell>;
}
const s=StyleSheet.create({art:{height:170,alignItems:'center',justifyContent:'center'},pin:{fontSize:72,color:'#D62828'},gap:{height:12},notice:{marginTop:18,gap:10},settings:{textAlign:'center',color:'#D62828',fontWeight:'600'},right:{textAlign:'right'}});
