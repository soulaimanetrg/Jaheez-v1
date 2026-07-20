import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { BRAND, FONTS } from '../../constants/brand';
import { useAuthStore } from '../../store/authStore';
import { useLangStore } from '../../store/languageStore';
import { backendJson } from '../../lib/backendApi';
import { backArrow, dirItems, dirRow, dirText } from '../../lib/direction';

type Address = {
  id: string;
  label: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  is_default: boolean;
};

const COPY = {
  fr: {
    title: 'Adresses',
    subtitle: 'Choisissez l’adresse utilisée pendant le checkout.',
    add: 'Ajouter',
    addAddress: 'Ajouter une adresse',
    editAddress: 'Modifier l’adresse',
    emptyTitle: 'Aucune adresse enregistrée',
    emptySub: 'Ajoutez une adresse pour commander plus vite.',
    default: 'Par défaut',
    setDefault: 'Définir par défaut',
    label: 'Nom de l’adresse',
    address: 'Adresse détaillée',
    labelPlaceholder: 'Maison, travail, bureau…',
    addressPlaceholder: 'Rue, quartier, immeuble, étage…',
    makeDefault: 'Utiliser comme adresse par défaut',
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    home: 'Maison',
    work: 'Travail',
    other: 'Autre',
    tip: 'L’adresse par défaut sera sélectionnée automatiquement au checkout.',
    deleteTitle: 'Supprimer l’adresse',
    deleteMessage: 'Voulez-vous vraiment supprimer cette adresse ?',
    cancel: 'Annuler',
    delete: 'Supprimer',
    error: 'Erreur',
    required: 'Veuillez remplir le nom et l’adresse.',
    saveFailed: 'Impossible d’enregistrer l’adresse. Vérifiez la connexion et réessayez.',
    deleteFailed: 'Impossible de supprimer cette adresse.',
    defaultFailed: 'Impossible de modifier l’adresse par défaut.',
    loading: 'Chargement des adresses…',
    useCurrentLocation: 'Utiliser ma position actuelle',
    locating: 'Recherche de votre position…',
    permissionDenied: 'Autorisez la localisation pour remplir l’adresse automatiquement.',
    locationFailed: 'Impossible de récupérer votre position. Vous pouvez saisir l’adresse manuellement.',
  },
  ar: {
    title: 'العناوين',
    subtitle: 'اختر العنوان المستخدم أثناء تأكيد الطلب.',
    add: 'إضافة',
    addAddress: 'إضافة عنوان',
    editAddress: 'تعديل العنوان',
    emptyTitle: 'لا توجد عناوين محفوظة',
    emptySub: 'أضف عنواناً لتطلب بسرعة أكبر.',
    default: 'افتراضي',
    setDefault: 'تعيين كافتراضي',
    label: 'اسم العنوان',
    address: 'العنوان التفصيلي',
    labelPlaceholder: 'المنزل، العمل، المكتب…',
    addressPlaceholder: 'الشارع، الحي، العمارة، الطابق…',
    makeDefault: 'استخدامه كعنوان افتراضي',
    save: 'حفظ العنوان',
    saving: 'جاري الحفظ…',
    home: 'المنزل',
    work: 'العمل',
    other: 'آخر',
    tip: 'سيتم اختيار العنوان الافتراضي تلقائياً في صفحة الدفع.',
    deleteTitle: 'حذف العنوان',
    deleteMessage: 'هل تريد حذف هذا العنوان؟',
    cancel: 'إلغاء',
    delete: 'حذف',
    error: 'خطأ',
    required: 'يرجى إدخال اسم العنوان والعنوان التفصيلي.',
    saveFailed: 'تعذر حفظ العنوان. تحقق من الاتصال وحاول مجدداً.',
    deleteFailed: 'تعذر حذف هذا العنوان.',
    defaultFailed: 'تعذر تغيير العنوان الافتراضي.',
    loading: 'جاري تحميل العناوين…',
    useCurrentLocation: 'استخدام موقعي الحالي',
    locating: 'جاري تحديد موقعك…',
    permissionDenied: 'يرجى السماح باستخدام الموقع لملء العنوان تلقائياً.',
    locationFailed: 'تعذر تحديد موقعك. يمكنك إدخال العنوان يدوياً.',
  },
  en: {
    title: 'Addresses',
    subtitle: 'Choose the address used during checkout.',
    add: 'Add',
    addAddress: 'Add address',
    editAddress: 'Edit address',
    emptyTitle: 'No saved addresses',
    emptySub: 'Add an address to order faster.',
    default: 'Default',
    setDefault: 'Set as default',
    label: 'Address name',
    address: 'Full address',
    labelPlaceholder: 'Home, work, office…',
    addressPlaceholder: 'Street, area, building, floor…',
    makeDefault: 'Use as default address',
    save: 'Save address',
    saving: 'Saving…',
    home: 'Home',
    work: 'Work',
    other: 'Other',
    tip: 'Your default address will be selected automatically at checkout.',
    deleteTitle: 'Delete address',
    deleteMessage: 'Do you really want to delete this address?',
    cancel: 'Cancel',
    delete: 'Delete',
    error: 'Error',
    required: 'Please fill in the label and address.',
    saveFailed: 'Could not save the address. Check your connection and try again.',
    deleteFailed: 'Could not delete this address.',
    defaultFailed: 'Could not change the default address.',
    loading: 'Loading addresses…',
    useCurrentLocation: 'Use my current location',
    locating: 'Finding your location…',
    permissionDenied: 'Allow location access to fill the address automatically.',
    locationFailed: 'Could not get your location. You can enter the address manually.',
  },
} as const;

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const { lang, isRTL } = useLangStore();
  const t = COPY[lang as keyof typeof COPY] ?? COPY.fr;
  const introAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Address | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formLat, setFormLat] = useState<number | null>(null);
  const [formLng, setFormLng] = useState<number | null>(null);
  const [formDefault, setFormDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    introAnim.setValue(0);
    Animated.timing(introAnim, {
      toValue: 1,
      duration: 680,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [introAnim]);

  useEffect(() => {
    if (!showModal) return;
    modalAnim.setValue(0);
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [modalAnim, showModal]);

  const presets = useMemo(
    () => [
      { label: t.home, icon: 'home-outline' as const },
      { label: t.work, icon: 'briefcase-outline' as const },
      { label: t.other, icon: 'location-outline' as const },
    ],
    [t.home, t.work, t.other],
  );

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setLoadingAddresses(false);
      return;
    }

    const fetchAddresses = async () => {
      try {
        const data = await backendJson<Address[]>('/admin-api/v1/customer/addresses');
        if (active) setAddresses(data || []);
      } finally {
        if (active) setLoadingAddresses(false);
      }
    };

    fetchAddresses();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const openAdd = () => {
    setEditTarget(null);
    setFormLabel('');
    setFormAddress('');
    setFormLat(null);
    setFormLng(null);
    setFormDefault(addresses.length === 0);
    setShowModal(true);
  };

  const openEdit = (address: Address) => {
    setEditTarget(address);
    setFormLabel(address.label);
    setFormAddress(address.address);
    setFormLat(address.lat ?? null);
    setFormLng(address.lng ?? null);
    setFormDefault(address.is_default);
    setShowModal(true);
  };

  const handleSave = async () => {
    const label = formLabel.trim();
    const address = formAddress.trim();

    if (!label || !address || !user?.id) {
      Alert.alert(t.error, t.required);
      return;
    }

    setSaving(true);
    try {
      if (editTarget) {
        const data = await backendJson<Address>(`/admin-api/v1/customer/addresses/${encodeURIComponent(editTarget.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ label, address, lat: formLat, lng: formLng, is_default: formDefault }),
        });

        if (data) {
          setAddresses(prev =>
            prev.map(item =>
              item.id === editTarget.id
                ? { ...item, label, address, lat: formLat, lng: formLng, is_default: formDefault }
                : formDefault ? { ...item, is_default: false } : item
            )
          );
        }
      } else {
        const data = await backendJson<Address>('/admin-api/v1/customer/addresses', {
          method: 'POST',
          body: JSON.stringify({ label, address, lat: formLat, lng: formLng, is_default: formDefault }),
        });

        if (data) {
          setAddresses(prev =>
            formDefault
              ? [...prev.map(item => ({ ...item, is_default: false })), data]
              : [...prev, data]
          );
        }
      }

      setShowModal(false);
    } catch (error: any) {
      Alert.alert(t.error, error?.message || t.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(t.deleteTitle, t.deleteMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await backendJson(`/admin-api/v1/customer/addresses/${encodeURIComponent(id)}`, {
              method: 'DELETE',
            });
            setAddresses(prev => prev.filter(item => item.id !== id));
          } catch {
            Alert.alert(t.error, t.deleteFailed);
          }
        },
      },
    ]);
  };

  const setDefault = async (id: string) => {
    const target = addresses.find(item => item.id === id);
    if (!target || !user?.id) return;

    try {
      await backendJson(`/admin-api/v1/customer/addresses/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ label: target.label, address: target.address, lat: target.lat ?? null, lng: target.lng ?? null, is_default: true }),
      });
      setAddresses(prev => prev.map(item => ({ ...item, is_default: item.id === id })));
    } catch {
      Alert.alert(t.error, t.defaultFailed);
    }
  };

  const formatReverseGeocode = (place: Location.LocationGeocodedAddress | null | undefined) => {
    if (!place) return '';
    const parts = [
      place.name,
      place.street,
      place.district,
      place.city,
      place.subregion,
      place.region,
      place.country,
    ]
      .map(part => (part || '').trim())
      .filter(Boolean);

    return Array.from(new Set(parts)).join(', ');
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(t.error, t.permissionDenied);
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      const places = await Location.reverseGeocodeAsync(coords).catch(() => []);
      const resolved = formatReverseGeocode(places[0]);
      if (!resolved) {
        Alert.alert(t.error, t.locationFailed);
        return;
      }
      setFormAddress(resolved);
      setFormLat(coords.latitude);
      setFormLng(coords.longitude);
      if (!formLabel.trim()) {
        setFormLabel(t.home);
      }
    } catch {
      Alert.alert(t.error, t.locationFailed);
    } finally {
      setLocating(false);
    }
  };

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [10, 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const headerTitleTranslateY = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [15, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View
        style={[
          styles.fixedHeader,
          {
            paddingTop: insets.top + 10,
            flexDirection: dirRow(isRTL),
          },
        ]}
      >
        <Pressable
          style={styles.fixedHeaderBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}
          accessibilityRole="button"
          accessibilityLabel={t.cancel}
        >
          <Ionicons name={backArrow(isRTL)} size={22} color={BRAND.TEXT} />
        </Pressable>

        <View style={styles.fixedHeaderCenter}>
          <Text style={styles.fixedHeaderTitle} numberOfLines={1}>
            {t.title}
          </Text>
        </View>

        <Pressable style={styles.fixedHeaderBtn} onPress={openAdd} accessibilityRole="button" accessibilityLabel={t.addAddress}>
          <Ionicons name="add" size={22} color={BRAND.TEXT} />
        </Pressable>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: 16,
            paddingBottom: insets.bottom + 40,
          },
        ]}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <Animated.View
          style={{
            opacity: introAnim,
            transform: [
              {
                translateY: introAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          }}
        >
          <Text style={[styles.subtitleScroll, { textAlign: dirText(isRTL) }]}>{t.subtitle}</Text>
        {loadingAddresses ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={BRAND.RED} />
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustration}>
              <Ionicons name="location-outline" size={56} color={BRAND.RED} />
            </View>
            <Text style={[styles.emptyTitle, { textAlign: dirText(isRTL) }]}>{t.emptyTitle}</Text>
            <Text style={[styles.emptySub, { textAlign: dirText(isRTL) }]}>{t.emptySub}</Text>
            <Pressable style={styles.primaryButton} onPress={openAdd} accessibilityRole="button" accessibilityLabel={t.addAddress}>
              <Text style={styles.primaryButtonText}>{t.addAddress}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((item) => (
              <View key={item.id} style={[styles.addressRow, { flexDirection: dirRow(isRTL) }]}>
                <View style={[styles.addressIcon, item.is_default && styles.addressIconDefault]}>
                  <Ionicons
                    name={item.is_default ? 'navigate' : 'location-outline'}
                    size={22}
                    color={item.is_default ? BRAND.RED : BRAND.TEXT3}
                  />
                </View>

                <View style={[styles.addressContent, { alignItems: dirItems(isRTL) }]}>
                  <View style={[styles.addressTitleRow, { flexDirection: dirRow(isRTL) }]}>
                    <Text style={[styles.addressLabel, { textAlign: dirText(isRTL) }]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {item.is_default && (
                      <View style={styles.defaultPill}>
                        <Text style={styles.defaultPillText}>{t.default}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.addressText, { textAlign: dirText(isRTL) }]} numberOfLines={2}>
                    {item.address}
                  </Text>

                  {!item.is_default && (
                    <Pressable onPress={() => setDefault(item.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t.setDefault}>
                      <Text style={styles.setDefaultText}>{t.setDefault}</Text>
                    </Pressable>
                  )}
                </View>

                <View style={styles.rowActions}>
                  <Pressable style={styles.rowActionButton} onPress={() => openEdit(item)} accessibilityRole="button" accessibilityLabel={t.editAddress}>
                    <Ionicons name="create-outline" size={18} color={BRAND.TEXT2} />
                  </Pressable>
                  <Pressable style={styles.rowActionButton} onPress={() => handleDelete(item.id)} accessibilityRole="button" accessibilityLabel={t.delete}>
                    <Ionicons name="trash-outline" size={18} color={BRAND.ERROR} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {!loadingAddresses && addresses.length > 0 && (
          <>
            <Pressable style={[styles.secondaryAddButton, { flexDirection: dirRow(isRTL) }]} onPress={openAdd} accessibilityRole="button" accessibilityLabel={t.addAddress}>
              <Ionicons name="add-circle-outline" size={20} color={BRAND.RED} />
              <Text style={styles.secondaryAddText}>{t.addAddress}</Text>
            </Pressable>

            <View style={[styles.tipCard, { flexDirection: dirRow(isRTL) }]}>
              <Ionicons name="information-circle-outline" size={19} color={BRAND.TEXT3} />
              <Text style={[styles.tipText, { textAlign: dirText(isRTL) }]}>{t.tip}</Text>
            </View>
          </>
        )}
        </Animated.View>
      </Animated.ScrollView>

      <Modal visible={showModal} animationType="fade" transparent onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Animated.View style={[styles.modalBackdrop, { opacity: modalAnim }]}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowModal(false)} />
          </Animated.View>

          <Animated.View
            style={[
              styles.modalSheet,
              {
                paddingBottom: insets.bottom + 20,
                opacity: modalAnim,
                transform: [
                  {
                    translateY: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [34, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { textAlign: dirText(isRTL) }]}>
              {editTarget ? t.editAddress : t.addAddress}
            </Text>

            <View style={[styles.presets, { flexDirection: dirRow(isRTL) }]}>
              {presets.map((preset) => {
                const active = formLabel === preset.label;
                return (
                  <Pressable
                    key={preset.label}
                    style={[styles.presetChip, active && styles.presetChipActive, { flexDirection: dirRow(isRTL) }]}
                    onPress={() => setFormLabel(preset.label)}
                    accessibilityRole="button"
                    accessibilityLabel={preset.label}
                  >
                    <Ionicons name={preset.icon} size={16} color={active ? BRAND.SURFACE : BRAND.TEXT3} />
                    <Text style={[styles.presetText, active && styles.presetTextActive]}>{preset.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { textAlign: dirText(isRTL) }]}>{t.label}</Text>
            <TextInput
              style={[styles.input, { textAlign: dirText(isRTL) }]}
              value={formLabel}
              onChangeText={setFormLabel}
              placeholder={t.labelPlaceholder}
              placeholderTextColor={BRAND.TEXT3}
            />

            <Pressable
              style={[styles.locationButton, { flexDirection: dirRow(isRTL) }, locating && styles.locationButtonDisabled]}
              onPress={handleUseCurrentLocation}
              disabled={locating}
              accessibilityRole="button"
              accessibilityLabel={t.useCurrentLocation}
            >
              {locating ? (
                <ActivityIndicator size="small" color={BRAND.RED} />
              ) : (
                <Ionicons name="navigate-outline" size={18} color={BRAND.RED} />
              )}
              <Text style={styles.locationButtonText}>
                {locating ? t.locating : t.useCurrentLocation}
              </Text>
            </Pressable>

            <Text style={[styles.fieldLabel, { textAlign: dirText(isRTL) }]}>{t.address}</Text>
            <TextInput
              style={[styles.input, styles.textArea, { textAlign: dirText(isRTL) }]}
              value={formAddress}
              onChangeText={(value) => {
                setFormAddress(value);
                setFormLat(null);
                setFormLng(null);
              }}
              placeholder={t.addressPlaceholder}
              placeholderTextColor={BRAND.TEXT3}
              multiline
              textAlignVertical="top"
            />

            <Pressable
              style={[styles.defaultToggle, { flexDirection: dirRow(isRTL) }]}
              onPress={() => setFormDefault(value => !value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: formDefault }}
              accessibilityLabel={t.makeDefault}
            >
              <View style={[styles.checkbox, formDefault && styles.checkboxActive]}>
                {formDefault && <Ionicons name="checkmark" size={14} color={BRAND.SURFACE} />}
              </View>
              <Text style={[styles.defaultToggleText, { textAlign: dirText(isRTL) }]}>{t.makeDefault}</Text>
            </Pressable>

            <Pressable
              style={[styles.saveButton, (!formLabel.trim() || !formAddress.trim() || saving) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!formLabel.trim() || !formAddress.trim() || saving}
              accessibilityRole="button"
              accessibilityLabel={t.save}
            >
              {saving ? (
                <ActivityIndicator color={BRAND.SURFACE} />
              ) : (
                <Text style={styles.saveButtonText}>{t.save}</Text>
              )}
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND.SURFACE,
  },
  fixedHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: BRAND.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.BORDER,
    alignItems: 'center',
    flexDirection: 'row',
  },
  fixedHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedHeaderTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 22,
    fontWeight: 'bold',
    color: BRAND.TEXT,
  },
  subtitleScroll: {
    fontFamily: FONTS.BODY,
    fontSize: 13.5,
    lineHeight: 20,
    color: BRAND.TEXT3,
    marginBottom: 24,
  },
  scroll: {
    paddingHorizontal: 16,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 90,
    gap: 12,
  },
  loadingText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 13,
    color: BRAND.TEXT3,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 58,
  },
  emptyIllustration: {
    width: 126,
    height: 126,
    borderRadius: 42,
    backgroundColor: BRAND.RED_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  emptyTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 22,
    lineHeight: 28,
    color: BRAND.TEXT,
  },
  emptySub: {
    marginTop: 8,
    fontFamily: FONTS.BODY,
    fontSize: 14,
    lineHeight: 21,
    color: BRAND.TEXT3,
  },
  primaryButton: {
    marginTop: 24,
    height: 52,
    borderRadius: 17,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.RED,
  },
  primaryButtonText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.SURFACE,
  },
  addressList: {
    gap: 8,
  },
  addressRow: {
    minHeight: 108,
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
  },
  addressIcon: {
    width: 50,
    height: 50,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.LIGHT,
  },
  addressIconDefault: {
    backgroundColor: BRAND.RED_LIGHT,
  },
  addressContent: {
    flex: 1,
    minWidth: 0,
  },
  addressTitleRow: {
    alignItems: 'center',
    gap: 8,
    maxWidth: '100%',
    marginBottom: 1,
  },
  addressLabel: {
    flexShrink: 1,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 17,
    lineHeight: 23,
    color: BRAND.TEXT,
  },
  defaultPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: BRAND.RED_LIGHT,
  },
  defaultPillText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 10,
    color: BRAND.RED,
  },
  addressText: {
    marginTop: 6,
    fontFamily: FONTS.BODY,
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.TEXT3,
  },
  setDefaultText: {
    marginTop: 8,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12,
    color: BRAND.RED,
  },
  rowActions: {
    width: 36,
    gap: 7,
    alignItems: 'center',
  },
  rowActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.LIGHT,
  },
  secondaryAddButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    borderRadius: 17,
    backgroundColor: BRAND.RED_LIGHT,
  },
  secondaryAddText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 14,
    color: BRAND.RED,
  },
  tipCard: {
    alignItems: 'center',
    gap: 9,
    marginTop: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: BRAND.LIGHT,
  },
  tipText: {
    flex: 1,
    fontFamily: FONTS.BODY,
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.TEXT3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.34)',
  },
  modalSheet: {
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: BRAND.SURFACE,
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 999,
    alignSelf: 'center',
    backgroundColor: BRAND.BORDER,
    marginBottom: 18,
  },
  modalTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 22,
    lineHeight: 28,
    color: BRAND.TEXT,
    marginBottom: 16,
  },
  presets: {
    gap: 8,
    marginBottom: 18,
  },
  presetChip: {
    alignItems: 'center',
    gap: 6,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 13,
    backgroundColor: BRAND.LIGHT,
  },
  presetChipActive: {
    backgroundColor: BRAND.RED,
  },
  presetText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 12,
    color: BRAND.TEXT2,
  },
  presetTextActive: {
    color: BRAND.SURFACE,
  },
  fieldLabel: {
    marginBottom: 8,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.TEXT2,
  },
  input: {
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    backgroundColor: BRAND.LIGHT,
    fontFamily: FONTS.BODY,
    fontSize: 14,
    color: BRAND.TEXT,
  },
  locationButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: BRAND.RED_LIGHT,
    marginTop: -2,
    marginBottom: 16,
  },
  locationButtonDisabled: {
    opacity: 0.72,
  },
  locationButtonText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.RED,
  },
  textArea: {
    height: 92,
    lineHeight: 20,
  },
  defaultToggle: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.LIGHT,
  },
  checkboxActive: {
    backgroundColor: BRAND.RED,
  },
  defaultToggleText: {
    flex: 1,
    fontFamily: FONTS.MEDIUM,
    fontSize: 14,
    color: BRAND.TEXT2,
  },
  saveButton: {
    height: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.RED,
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 16,
    color: BRAND.SURFACE,
  },
});
