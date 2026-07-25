import { AppIcon } from '@/components/ui/AppIcon';
import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, Linking, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Phone, Map, CheckCircle2, AlertTriangle, X } from 'lucide-react-native';
import { BRAND, FONTS, SHADOW } from '@/constants/brand';
import { useLangStore } from '@/lib/i18n';
import { driverApi, type OrderRow } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import { generateSecureUUID } from '@/lib/uuid';

const STAGES: Array<{
  key: 'arrived_pickup' | 'picked_up' | 'arrived_customer' | 'delivered';
  label: keyof ReturnType<typeof useLangStore.getState>['t'];
}> = [
  { key: 'arrived_pickup',   label: 'stage_arrived_pickup' },
  { key: 'picked_up',        label: 'stage_picked_up' },
  { key: 'arrived_customer', label: 'stage_arrived_customer' },
  { key: 'delivered',        label: 'stage_delivered' },
];

function currentStageIndex(o: OrderRow) {
  if (o.delivered_at)        return 4;
  if (o.arrived_customer_at) return 3;
  if (o.picked_up_at)        return 2;
  if (o.arrived_pickup_at)   return 1;
  return 0;
}

export function ActiveDeliveryScreen() {
  const router = useRouter();
  const t = useLangStore(s => s.t);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [navigationBusy, setNavigationBusy] = useState<'pickup' | 'dropoff' | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [confirmationCode,setConfirmationCode]=useState('');
  const [proofBusy,setProofBusy]=useState(false);
  const lang = useLangStore(s => s.lang);

  async function load() {
    try {
      const list = await driverApi.orders('mine');
      const found = list.find(o => o.id === id);
      if (!found) {
        const hist = await driverApi.orders('history');
        setOrder(hist.find(o => o.id === id) || null);
      } else setOrder(found);
    } catch (e: any) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function advance() {
    if (!order) return;
    const idx = currentStageIndex(order);
    if (idx >= STAGES.length) return;
    const next = STAGES[idx];
    setBusy(true);
    try {
      const needsCode=next.key==='picked_up'||next.key==='delivered';
      if(needsCode&&!/^\d{4}$/.test(confirmationCode.trim())) throw new Error('Le code OTP à 4 chiffres est obligatoire.');
      const updated = await driverApi.stage(order.id, next.key,needsCode?confirmationCode.trim():undefined);
      setOrder((current)=>current?{...current,...updated}:updated);
      setConfirmationCode('');
      if (next.key === 'delivered') {
        Alert.alert('Bravo !', 'Course terminée', [{ text: t.ok, onPress: () => router.replace('/(tabs)') }]);
      }
    } catch (e: any) { Alert.alert('Erreur', e.message); }
    finally { setBusy(false); }
  }

  async function uploadProof(){
    if(!order||order.order_type!=='errand')return;
    const proofType=currentStageIndex(order)>=2?'delivery':'pickup';
    setProofBusy(true);
    try{
      const permission=await ImagePicker.requestCameraPermissionsAsync();
      if(!permission.granted)throw new Error('Autorisation caméra requise.');
      const result=await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:.7,base64:true});
      if(result.canceled)return;
      const asset=result.assets[0];
      if(!asset.base64)throw new Error('Image invalide.');
      const mime=(asset.mimeType||'image/jpeg') as 'image/jpeg'|'image/png'|'image/webp';
      if(!['image/jpeg','image/png','image/webp'].includes(mime))throw new Error('Format image non autorisé.');
      const uuid = generateSecureUUID();
      if (!uuid) throw new Error('Identifiant sécurisé indisponible.');
      await driverApi.uploadErrandProof(order.id,proofType,mime,asset.base64,`proof:${uuid}`);
      Alert.alert('Preuve enregistrée','La photo a été stockée de manière sécurisée.');
    }catch(error:any){Alert.alert('Erreur',error?.message||'Impossible d’envoyer la preuve.');}
    finally{setProofBusy(false);}
  }

  async function openNavigation(destination: 'pickup' | 'dropoff') {
    if (!order) return;
    setNavigationBusy(destination);
    try {
      const nav = await driverApi.navigation(order.id, destination);
      const canOpen = await Linking.canOpenURL(nav.url);
      if (!canOpen) throw new Error('Application de navigation indisponible');
      await Linking.openURL(nav.url);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible d’ouvrir la navigation');
    } finally {
      setNavigationBusy(null);
    }
  }

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.BG, justifyContent: 'center' }}><ActivityIndicator color={BRAND.RED} /></SafeAreaView>;
  if (!order)  return <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.BG, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: FONTS.SEMIBOLD, color: BRAND.TEXT2 }}>Commande introuvable</Text></SafeAreaView>;

  const idx = currentStageIndex(order);
  const stageLabel = idx === 0 ? t.stage_heading : t[STAGES[idx - 1]?.label as keyof typeof t];
  const isDone = idx >= STAGES.length;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: BRAND.BG }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND.SURFACE, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BRAND.BORDER }}>
          <AppIcon icon={ChevronLeft} size={22} color={BRAND.TEXT} />
        </Pressable>
        <Text style={{ marginLeft: 12, fontFamily: FONTS.DISPLAY, fontSize: 18, color: BRAND.TEXT }}>{t.activeDelivery}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Current stage banner */}
        <View style={[{ backgroundColor: isDone ? BRAND.GREEN : BRAND.RED, borderRadius: 18, padding: 18, marginBottom: 14 }, SHADOW]}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: FONTS.SEMIBOLD, fontSize: 12, marginBottom: 4 }}>
            #{order.id.slice(0, 8)}
          </Text>
          <Text style={{ color: '#fff', fontFamily: FONTS.DISPLAY, fontSize: 22 }}>{stageLabel}</Text>
        </View>

        {/* Stepper */}
        <View style={{ backgroundColor: BRAND.SURFACE, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: BRAND.BORDER }}>
          {STAGES.map((s, i) => {
            const done = i < idx;
            const active = i === idx;
            return (
              <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: done ? BRAND.GREEN : active ? BRAND.RED : BRAND.LIGHT }}>
                  {done ? <AppIcon icon={CheckCircle2} size={16} color="#fff" />
                    : <Text style={{ color: '#fff', fontFamily: FONTS.DISPLAY, fontSize: 12 }}>{i + 1}</Text>}
                </View>
                <Text style={{ flex: 1, fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: done ? BRAND.GREEN : active ? BRAND.TEXT : BRAND.TEXT3 }}>
                  {t[s.label as keyof typeof t]}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Store Pickup Section */}
        <View style={[{ backgroundColor: BRAND.SURFACE, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: BRAND.BORDER }]}>
          <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: BRAND.TEXT3, marginBottom: 6 }}>
            {lang === 'ar' ? 'نقطة الاستلام (المتجر)' : (lang === 'en' ? 'Pickup Point (Store)' : 'Point de retrait (Magasin)')}
          </Text>
          <Text style={{ fontFamily: FONTS.DISPLAY, fontSize: 16, color: BRAND.TEXT, marginBottom: 6 }}>
            {lang === 'ar' && (order as any).store_name_ar ? (order as any).store_name_ar : (order as any).store_name || 'Magasin'}
          </Text>
          <Pressable onPress={() => openNavigation('pickup')} style={{ flexDirection: 'row', gap: 8 }}>
            <AppIcon icon={MapPin} size={18} color={BRAND.GREEN} style={{ marginTop: 2 }} />
            <Text style={{ flex: 1, fontFamily: FONTS.BODY, fontSize: 14, color: BRAND.TEXT, lineHeight: 20 }}>
              {lang === 'ar' && (order as any).store_address_ar ? (order as any).store_address_ar : (order as any).store_address || '—'}
            </Text>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Pressable onPress={() => openNavigation('pickup')} disabled={navigationBusy === 'pickup'}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: BRAND.LIGHT, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, opacity: navigationBusy === 'pickup' ? 0.65 : 1 }}>
              {navigationBusy === 'pickup' ? <ActivityIndicator size="small" color={BRAND.TEXT} /> : <AppIcon icon={Map} size={14} color={BRAND.TEXT} />}
              <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: BRAND.TEXT }}>{t.openMap}</Text>
            </Pressable>
            {!!(order as any).store_phone && (
              <Pressable onPress={() => Linking.openURL('tel:' + (order as any).store_phone)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: BRAND.LIGHT, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                <AppIcon icon={Phone} size={14} color={BRAND.TEXT} />
                <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: BRAND.TEXT }}>
                  {lang === 'ar' ? 'اتصل بالمتجر' : (lang === 'en' ? 'Call Store' : 'Appeler le magasin')}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Dropoff Customer Section */}
        <View style={[{ backgroundColor: BRAND.SURFACE, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: BRAND.BORDER }]}>
          <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: BRAND.TEXT3, marginBottom: 6 }}>{t.dropoff}</Text>
          <Text style={{ fontFamily: FONTS.DISPLAY, fontSize: 16, color: BRAND.TEXT, marginBottom: 6 }}>
            {(order as any).customer_name || 'Client'}
          </Text>
          <Pressable onPress={() => openNavigation('dropoff')} style={{ flexDirection: 'row', gap: 8 }}>
            <AppIcon icon={MapPin} size={18} color={BRAND.RED} style={{ marginTop: 2 }} />
            <Text style={{ flex: 1, fontFamily: FONTS.BODY, fontSize: 14, color: BRAND.TEXT, lineHeight: 20 }}>{order.delivery_address}</Text>
          </Pressable>
          {!!order.notes && (
            <View style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: BRAND.YELLOW_LIGHT,
              borderWidth: 1.5,
              borderColor: BRAND.YELLOW,
              borderRadius: 12,
              flexDirection: 'row',
              gap: 8,
              alignItems: 'center'
            }}>
              <AppIcon icon={AlertTriangle} size={20} color={BRAND.YELLOW_DARK} style={{ flexShrink: 0 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: BRAND.YELLOW_DARK }}>
                  {lang === 'ar' ? 'تعليمات الزبون المهمة:' : (lang === 'en' ? 'Important Customer Note:' : 'Remarque client importante :')}
                </Text>
                <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT, marginTop: 2 }}>
                  {order.notes}
                </Text>
              </View>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Pressable onPress={() => openNavigation('dropoff')} disabled={navigationBusy === 'dropoff'}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: BRAND.LIGHT, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, opacity: navigationBusy === 'dropoff' ? 0.65 : 1 }}>
              {navigationBusy === 'dropoff' ? <ActivityIndicator size="small" color={BRAND.TEXT} /> : <AppIcon icon={Map} size={14} color={BRAND.TEXT} />}
              <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: BRAND.TEXT }}>{t.openMap}</Text>
            </Pressable>
            {!!(order as any).customer_phone && (
              <Pressable onPress={() => Linking.openURL('tel:' + (order as any).customer_phone)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: BRAND.LIGHT, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                <AppIcon icon={Phone} size={14} color={BRAND.TEXT} />
                <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: BRAND.TEXT }}>{t.callCustomer}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Order Items Section */}
        {(order as any).items && (order as any).items.length > 0 && (
          <View style={{ backgroundColor: BRAND.SURFACE, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: BRAND.BORDER }}>
            <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: BRAND.TEXT3, marginBottom: 10 }}>
              {lang === 'ar' ? 'تفاصيل السلة' : (lang === 'en' ? 'Order Items' : 'Articles commandés')}
            </Text>
            {(order as any).items.map((item: any, idx: number) => (
              <View key={item.id || idx} style={{ paddingVertical: 8, borderBottomWidth: idx < (order as any).items.length - 1 ? 1 : 0, borderBottomColor: BRAND.BORDER2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT }}>
                      {lang === 'ar' && item.name_ar ? item.name_ar : item.name}
                    </Text>
                    <Text style={{ fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.TEXT3, marginTop: 2 }}>
                      {item.quantity} × {Number(item.unit_price).toFixed(2)} DH
                    </Text>
                  </View>
                  <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT }}>
                    {Number(item.total_price).toFixed(2)} DH
                  </Text>
                </View>
                {item.options && item.options.length > 0 && (
                  <View style={{
                    marginTop: 6,
                    padding: 8,
                    backgroundColor: BRAND.RED_LIGHT,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(240,48,48,0.15)',
                    gap: 4
                  }}>
                    {item.options.map((opt: any, optIdx: number) => (
                      <Text key={optIdx} style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: BRAND.RED_DARK }}>
                        • {opt.option_label ? `${opt.option_label}: ` : ''}{opt.choice_name || opt.name} {opt.price_delta > 0 ? ` (+${opt.price_delta.toFixed(2)} DH)` : ''}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Payment summary */}
        <View style={{ backgroundColor: BRAND.SURFACE, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: BRAND.BORDER }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT2 }}>
              {lang === 'ar' ? 'طريقة الدفع' : (lang === 'en' ? 'Payment Method' : 'Mode de paiement')}
            </Text>
            <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT }}>
              {order.payment_method === 'cash' ? t.cash : t.card}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT2 }}>
              {lang === 'ar' ? 'قيمة المنتجات' : (lang === 'en' ? 'Subtotal' : 'Sous-total')}
            </Text>
            <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT }}>
              {Number(order.subtotal).toFixed(2)} DH
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT2 }}>
              {lang === 'ar' ? 'رسوم التوصيل' : (lang === 'en' ? 'Delivery Fee' : 'Frais de livraison')}
            </Text>
            <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT }}>
              {Number(order.delivery_fee).toFixed(2)} DH
            </Text>
          </View>

          {Number((order as any).discount || 0) > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.GREEN }}>
                {lang === 'ar' ? 'خصم الكود' : (lang === 'en' ? 'Promo Discount' : 'Remise promo')}
              </Text>
              <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.GREEN }}>
                - {Number((order as any).discount).toFixed(2)} DH
              </Text>
            </View>
          )}

          {Number((order as any).rider_tip || 0) > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT2 }}>
                {lang === 'ar' ? 'البقشيش' : (lang === 'en' ? 'Rider Tip' : 'Pourboire livreur')}
              </Text>
              <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT }}>
                {Number((order as any).rider_tip).toFixed(2)} DH
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: BRAND.BORDER2 }}>
            <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT }}>
              {order.payment_method === 'cash' 
                ? (lang === 'ar' ? 'المبلغ المطلوب تحصيله' : (lang === 'en' ? 'Cash to Collect' : 'Total à encaisser'))
                : (lang === 'ar' ? 'المجموع الكلي' : (lang === 'en' ? 'Total Amount' : 'Total commande'))}
            </Text>
            <Text style={{ fontFamily: FONTS.DISPLAY, fontSize: 18, color: BRAND.RED }}>
              {Number(order.total_amount).toFixed(2)} DH
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: BRAND.BORDER2 }}>
            <Text style={{ fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT2 }}>
              {lang === 'ar' ? 'تقدير أرباحك' : (lang === 'en' ? 'Estimated earning' : 'Gain estime')}
            </Text>
            <Text style={{ fontFamily: FONTS.DISPLAY, fontSize: 16, color: BRAND.GREEN }}>
              {Number((order as any).estimated_earning_dh || 0).toFixed(2)} DH
            </Text>
          </View>
          <Text style={{ marginTop: 4, fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.TEXT3 }}>
            {lang === 'ar' ? 'المبلغ النهائي يؤكد بعد نهاية الشيفت.' : (lang === 'en' ? 'Final payout is confirmed after shift end.' : 'Le payout final est confirme apres fin de shift.')}
          </Text>
        </View>

        {/* CTA */}
        {!isDone && (
          <>
            {order.order_type==='errand'&&idx>0?<Pressable onPress={uploadProof} disabled={proofBusy} style={{marginBottom:12,paddingVertical:14,borderRadius:14,alignItems:'center',backgroundColor:BRAND.SURFACE,borderWidth:1,borderColor:BRAND.BORDER}}>{proofBusy?<ActivityIndicator color={BRAND.RED}/>:<Text style={{fontFamily:FONTS.SEMIBOLD,color:BRAND.TEXT}}>Ajouter une preuve photo ({idx>=2?'livraison':'retrait'})</Text>}</Pressable>:null}
            {(idx===1||idx===3)?<TextInput value={confirmationCode} onChangeText={setConfirmationCode} keyboardType="number-pad" maxLength={4} secureTextEntry placeholder="Code OTP à 4 chiffres" style={{height:52,borderRadius:14,borderWidth:1,borderColor:BRAND.BORDER,backgroundColor:BRAND.SURFACE,paddingHorizontal:16,marginBottom:12,fontFamily:FONTS.SEMIBOLD,color:BRAND.TEXT}}/>:null}
            <Pressable onPress={advance} disabled={busy}
              style={{ backgroundColor: BRAND.RED, paddingVertical: 18, borderRadius: 14, alignItems: 'center', opacity: busy ? 0.6 : 1 }}>
              {busy ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontFamily: FONTS.DISPLAY, fontSize: 16 }}>
                    {idx === 0 ? t.stage_arrived_pickup
                     : idx === 1 ? t.stage_picked_up
                     : idx === 2 ? t.stage_arrived_customer
                     : t.markComplete}
                  </Text>}
            </Pressable>

            <Pressable onPress={() => setIssueOpen(true)}
              style={{ marginTop: 12, paddingVertical: 14, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: BRAND.SURFACE, borderWidth: 1, borderColor: BRAND.WARN }}>
              <AppIcon icon={AlertTriangle} size={16} color={BRAND.WARN} />
              <Text style={{ color: BRAND.WARN, fontFamily: FONTS.SEMIBOLD, fontSize: 14 }}>Signaler un problème</Text>
            </Pressable>

            {/* Cancel Order Button */}
            {order.status !== 'delivered' && order.status !== 'completed' && order.status !== 'cancelled' && (
              <Pressable onPress={() => setCancelOpen(true)}
                style={{ marginTop: 12, paddingVertical: 14, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: BRAND.SURFACE, borderWidth: 1, borderColor: BRAND.RED }}>
                <AppIcon icon={X} size={16} color={BRAND.RED} />
                <Text style={{ color: BRAND.RED, fontFamily: FONTS.SEMIBOLD, fontSize: 14 }}>
                  {lang === 'ar' ? 'إلغاء الطلب' : (lang === 'en' ? 'Cancel Order' : 'Annuler la commande')}
                </Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>

      <IssueSheet
        visible={issueOpen}
        orderId={order.id}
        onClose={() => setIssueOpen(false)}
        onSubmitted={() => { setIssueOpen(false); Alert.alert('OK', 'Problème signalé. Le support va vous contacter.'); }}
      />

      <CancelOrderSheet
        visible={cancelOpen}
        orderId={order.id}
        lang={lang}
        onClose={() => setCancelOpen(false)}
        onSubmitted={() => {
          setCancelOpen(false);
          Alert.alert(
            lang === 'ar' ? 'تم الإلغاء' : 'Annulé',
            lang === 'ar' ? 'تم إلغاء الطلب بنجاح.' : 'La commande a été annulée avec succès.',
            [{ text: t.ok, onPress: () => router.replace('/(tabs)') }]
          );
        }}
      />
    </SafeAreaView>
  );
}

const ISSUE_REASONS = [
  { key: 'customer_no_answer', label: 'Client injoignable' },
  { key: 'customer_not_present', label: 'Client absent à l’adresse' },
  { key: 'wrong_address', label: 'Adresse incorrecte' },
  { key: 'store_problem', label: 'Problème au point de retrait' },
  { key: 'vehicle_problem', label: 'Problème de véhicule' },
  { key: 'other', label: 'Autre' },
];

function IssueSheet({ visible, orderId, onClose, onSubmitted }: {
  visible: boolean; orderId: string; onClose: () => void; onSubmitted: () => void;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!visible) { setReason(null); setNote(''); } }, [visible]);

  async function submit() {
    if (!reason) return Alert.alert('Erreur', 'Choisissez une raison');
    setSubmitting(true);
    try {
      await driverApi.reportIssue(orderId, reason, note || undefined);
      onSubmitted();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible d’envoyer le signalement');
    } finally { setSubmitting(false); }
  }

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: BRAND.SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontFamily: FONTS.DISPLAY, fontSize: 18, color: BRAND.TEXT }}>Signaler un problème</Text>
            <Pressable onPress={onClose} hitSlop={10}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: BRAND.LIGHT, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon icon={X} size={16} color={BRAND.TEXT2} />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 320 }}>
            {ISSUE_REASONS.map(r => (
              <Pressable key={r.key} onPress={() => setReason(r.key)}
                style={{ padding: 14, borderRadius: 12, marginBottom: 8,
                  backgroundColor: reason === r.key ? BRAND.RED_LIGHT : BRAND.BG,
                  borderWidth: 1, borderColor: reason === r.key ? BRAND.RED : BRAND.BORDER }}>
                <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: reason === r.key ? BRAND.RED : BRAND.TEXT }}>{r.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <TextInput value={note} onChangeText={setNote} placeholder="Détails (optionnel)" placeholderTextColor={BRAND.TEXT3}
            multiline numberOfLines={3}
            style={{ marginTop: 8, backgroundColor: BRAND.BG, borderWidth: 1, borderColor: BRAND.BORDER, borderRadius: 12, padding: 12, fontFamily: FONTS.BODY, fontSize: 14, color: BRAND.TEXT, minHeight: 70, textAlignVertical: 'top' }} />

          <Pressable onPress={submit} disabled={submitting || !reason}
            style={{ marginTop: 16, backgroundColor: reason ? BRAND.RED : BRAND.LIGHT, paddingVertical: 14, borderRadius: 12, alignItems: 'center', opacity: submitting ? 0.6 : 1 }}>
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: reason ? '#fff' : BRAND.TEXT3, fontFamily: FONTS.DISPLAY, fontSize: 15 }}>Envoyer</Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function CancelOrderSheet({ visible, orderId, onClose, onSubmitted, lang }: {
  visible: boolean; orderId: string; onClose: () => void; onSubmitted: () => void; lang: string;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!visible) { setReason(null); setNote(''); } }, [visible]);

  async function submit() {
    if (!reason) return Alert.alert('Erreur', 'Choisissez une raison');
    setSubmitting(true);
    try {
      const fullReason = note ? `${reason}: ${note}` : reason;
      await driverApi.cancel(orderId, fullReason);
      onSubmitted();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible d’annuler la commande');
    } finally { setSubmitting(false); }
  }

  const reasons = [
    { key: 'Panne / Accident / Véhicule', label: lang === 'ar' ? 'عطل في المركبة / حادث' : (lang === 'en' ? 'Vehicle Breakdown / Accident' : 'Panne de véhicule / Accident') },
    { key: 'Client injoignable', label: lang === 'ar' ? 'العميل لا يجيب' : (lang === 'en' ? 'Customer Unreachable' : 'Client injoignable') },
    { key: 'Magasin fermé', label: lang === 'ar' ? 'المتجر مغلق' : (lang === 'en' ? 'Store Closed' : 'Magasin fermé') },
    { key: 'Autre', label: lang === 'ar' ? 'سبب آخر' : (lang === 'en' ? 'Other' : 'Autre') },
  ];

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: BRAND.SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontFamily: FONTS.DISPLAY, fontSize: 18, color: BRAND.TEXT }}>
              {lang === 'ar' ? 'إلغاء الطلب' : (lang === 'en' ? 'Cancel Order' : 'Annuler la commande')}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: BRAND.LIGHT, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon icon={X} size={16} color={BRAND.TEXT2} />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 220 }}>
            {reasons.map(r => (
              <Pressable key={r.key} onPress={() => setReason(r.key)}
                style={{ padding: 14, borderRadius: 12, marginBottom: 8,
                  backgroundColor: reason === r.key ? BRAND.RED_LIGHT : BRAND.BG,
                  borderWidth: 1, borderColor: reason === r.key ? BRAND.RED : BRAND.BORDER }}>
                <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: reason === r.key ? BRAND.RED : BRAND.TEXT }}>{r.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <TextInput value={note} onChangeText={setNote} 
            placeholder={lang === 'ar' ? 'تفاصيل إضافية' : (lang === 'en' ? 'Additional details' : 'Détails supplémentaires')} 
            placeholderTextColor={BRAND.TEXT3}
            multiline numberOfLines={3}
            style={{ marginTop: 8, backgroundColor: BRAND.BG, borderWidth: 1, borderColor: BRAND.BORDER, borderRadius: 12, padding: 12, fontFamily: FONTS.BODY, fontSize: 14, color: BRAND.TEXT, minHeight: 70, textAlignVertical: 'top' }} />

          <Pressable onPress={submit} disabled={submitting || !reason}
            style={{ marginTop: 16, backgroundColor: reason ? BRAND.RED : BRAND.LIGHT, paddingVertical: 14, borderRadius: 12, alignItems: 'center', opacity: submitting ? 0.6 : 1 }}>
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: reason ? '#fff' : BRAND.TEXT3, fontFamily: FONTS.DISPLAY, fontSize: 15 }}>
                  {lang === 'ar' ? 'إرسال وإلغاء الطلب' : (lang === 'en' ? 'Confirm Cancellation' : 'Confirmer l’annulation')}
                </Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
