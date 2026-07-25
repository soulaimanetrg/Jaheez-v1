import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  LayoutAnimation,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Asset } from 'expo-asset';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { BRAND, FONTS, SHADOW_SM } from '../../../constants/brand';
import { ASSETS } from '../../../constants/assets';
import { formatDh } from '../../../lib/money';
import {
  toggleFavorite, checkFavorite,
  toggleFavoriteProduct, checkFavoriteProduct,
} from '../../../lib/storeApi';
import { useStore as useStoreQuery, useStoreMenu as useStoreMenuQuery } from '../../../hooks/queries/useStores';
import { adminApiUrl, resolveStoreImageUrl } from '../../../lib/adminApi';

import { isStoreCurrentlyOpen } from '../../../lib/storeStatus';
import { useAuthStore } from '../../../store/authStore';
import { useCartStore } from '../../../store/cartStore';
import { useLangStore } from '../../../store/languageStore';
import { dirItems, dirRow, dirRowReverse, dirText, backArrow } from '../../../lib/direction';
import { normalizeMobileOptionGroups } from '@/features/orders/optionGroups';
import { restoreProductSelections, selectProductChoice, productSelectionsAreValid, type ProductSelections } from '@/features/orders/productLineEditor';

/* ── Layout helpers (Density-independent pixels) ─────────── */
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const px = (n: number) => n;
const SIDE = 20;

/* ── Fallbacks ──────────────────────────────────────── */
const FALLBACK_COVER = Asset.fromModule(ASSETS.illustrations.jaheez_food_bag_large).uri;
const FALLBACK_ITEM = Asset.fromModule(ASSETS.illustrations.jaheez_food).uri;


const getFallbackProductImage = (storeNameStr?: string, storeCategory?: string) => {
  const str = `${storeNameStr || ''} ${storeCategory || ''}`.toLowerCase();
  if (str.includes('pharm') || str.includes('health') || str.includes('med') || str.includes('صيدل') || str.includes('دواء') || str.includes('شفاء')) {
    return Asset.fromModule(ASSETS.illustrations.jaheez_pharmacy).uri;
  }
  if (str.includes('coffee') || str.includes('cafe') || str.includes('café') || str.includes('قهو')) {
    return Asset.fromModule(ASSETS.illustrations.jaheez_food).uri;
  }
  if (str.includes('bakery') || str.includes('bread') || str.includes('خبز') || str.includes('مخبز') || str.includes('boulangerie')) {
    return Asset.fromModule(ASSETS.illustrations.jaheez_food).uri;
  }
  if (str.includes('juice') || str.includes('drink') || str.includes('jus') || str.includes('boisson') || str.includes('عصير') || str.includes('مشروب')) {
    return Asset.fromModule(ASSETS.illustrations.jaheez_grocery).uri;
  }
  return FALLBACK_ITEM;
};

/* ── Helpers ────────────────────────────────────────── */
function parseBilingualText(text: string, lang: string, fallback: string = "") {
  if (!text) return fallback;
  const parts = text.split("|");
  if (parts.length > 1) {
    return lang === 'en' ? (parts[1] || "").trim() : (parts[0] || "").trim();
  }
  return text.trim();
}

function money(value: any) {
  const amount = Number(value || 0);
  const safe = Number.isFinite(amount) ? amount : 0;
  const suffix = 'DH';
  return `${safe.toFixed(2)} ${suffix}`;
}

function categoryName(category: any, index: number, lang: string) {
  if (lang === 'ar') {
    return category?.name_ar || category?.title_ar || category?.name || category?.title || `قسم ${index + 1}`;
  }
  const raw = category?.name || category?.title || category?.name_ar || category?.title_ar || `Section ${index + 1}`;
  return parseBilingualText(raw, lang);
}

/* ── Sub-components ─────────────────────────────────── */

function HeaderBtn({ icon, color, onPress }: { icon: any; color?: string; onPress?: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        s.headerBtn,
        pressed && { transform: [{ scale: 0.94 }], opacity: 0.9 }
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={px(20)} color={color || BRAND.TEXT} />
    </Pressable>
  );
}

const ProductRow = React.memo(
  function ProductRow({ item, quantity, onAdd, onUpdateQty, disabled, storeName, storeCategory }: {
    item: any;
    quantity: number;
    onAdd: () => void;
    onUpdateQty: (qty: number) => void;
    disabled?: boolean;
    storeName?: string;
    storeCategory?: string;
  }) {
    const { lang, isRTL } = useLangStore();
    const appear = useRef(new Animated.Value(0)).current;
    const prevQty = useRef(quantity);
    const [isFavorited, setIsFavorited] = useState(false);

    useEffect(() => {
      checkFavoriteProduct(item.id).then(setIsFavorited);
    }, [item.id]);

    const handleProductFavorite = async () => {
      const { data, error } = await toggleFavoriteProduct(item.id);
      if (!error && data !== null) {
        setIsFavorited(data);
      }
    };

    useEffect(() => {
      Animated.timing(appear, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, [appear]);

    useEffect(() => {
      if ((prevQty.current === 0 && quantity > 0) || (prevQty.current > 0 && quantity === 0)) {
        LayoutAnimation.configureNext({
          duration: 240,
          update: { type: LayoutAnimation.Types.easeInEaseOut },
          create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
          delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
        });
      }
      prevQty.current = quantity;
    }, [quantity]);

    const fallbackImg = getFallbackProductImage(storeName, storeCategory);
    const basePrice = Number(item.original_price_dh ?? item.price ?? 0);
    const promoPrice = Number(item.display_price_dh ?? item.price ?? 0);
    const hasPromo = item.has_active_promotion === true;

    return (
      <Animated.View
        style={{
          opacity: appear,
          transform: [{
            translateY: appear.interpolate({
              inputRange: [0, 1],
              outputRange: [px(12), 0],
            }),
          }],
        }}
      >
        <Pressable
          onPress={disabled ? undefined : onAdd}
          style={({ pressed }) => [
            s.productCardContainer,
            pressed && !disabled && { backgroundColor: '#F8FAFC' }
          ]}
          disabled={disabled}
        >
          <View style={[s.productRow, { flexDirection: dirRow(isRTL) }]}>
            {/* Image (start) */}
            <View style={s.productImageContainer}>
              <Image source={{ uri: resolveStoreImageUrl(item.image_url, fallbackImg) }} style={s.productCardImg} contentFit="cover" />
              {hasPromo && (
                <View style={[s.productPromoAmountBadge, isRTL ? { right: px(7), left: undefined } : { left: px(7), right: undefined }]}>
                  <Text style={s.productPromoAmountText}>{item.promotion_label}</Text>
                </View>
              )}
              <Pressable
                style={[
                  s.rowHeartBtn,
                  isRTL ? { left: px(6), right: undefined } : { right: px(6), left: undefined }
                ]}
                onPress={handleProductFavorite}
              >
                <Ionicons
                  name={isFavorited ? 'heart' : 'heart-outline'}
                  size={px(16)}
                  color={isFavorited ? BRAND.RED : 'rgba(0,0,0,0.4)'}
                />
              </Pressable>
            </View>

            {/* Info Block (middle/end) */}
            <View style={{ flex: 1, gap: px(4) }}>
              {/* Title */}
              <Text style={[s.productCardTitle, { textAlign: dirText(isRTL) }]} numberOfLines={2}>
                {lang === 'ar' ? (item.name_ar || item.name) : parseBilingualText(item.name, lang, item.name_ar)}
              </Text>

              {/* Description */}
              {(item.description_ar || item.description) ? (
                <Text style={[s.productCardDesc, { textAlign: dirText(isRTL) }]} numberOfLines={2}>
                  {lang === 'ar' ? (item.description_ar || '') : parseBilingualText(item.description, lang, item.description_ar || '')}
                </Text>
              ) : null}

              {/* Bottom Row: Price & Stepper */}
              <View style={{ flexDirection: dirRow(isRTL), justifyContent: 'space-between', alignItems: 'center', marginTop: px(6) }}>
                <View style={[s.priceContainer, { flexDirection: dirRow(isRTL), alignItems: 'center', gap: px(6) }]}>
                  {hasPromo ? (
                    <>
                      <Text style={s.productCardPrice}>
                        {money(promoPrice)}
                      </Text>
                      {basePrice > 0 && (
                        <Text style={s.originalPriceStrike}>
                          {money(basePrice)}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text style={s.productCardPrice}>
                      {money(item.price)}
                    </Text>
                  )}
                </View>

                {/* Control */}
                <View style={s.productCardControl}>
                  {disabled ? (
                    <View style={s.closedBtnSmall}>
                      <Text style={s.closedBtnText}>{lang === 'ar' ? 'غير متوفر' : 'Indisponible'}</Text>
                    </View>
                  ) : quantity === 0 ? (
                    <Pressable
                      style={({ pressed }) => [s.productAddCircle, pressed && { transform: [{ scale: 0.9 }] }]}
                      onPress={onAdd}
                    >
                      <Ionicons name="add" size={18} color={BRAND.YELLOW} />
                    </Pressable>
                  ) : (
                    <View style={s.stepperCircle}>
                      <Pressable style={s.stepperCircleBtnMinus} onPress={() => onUpdateQty(quantity - 1)}>
                        <Ionicons
                          name={quantity === 1 ? 'trash-outline' : 'remove'}
                          size={14}
                          color={BRAND.RED}
                        />
                      </Pressable>
                      <Text style={s.stepperText}>{quantity}</Text>
                      <Pressable style={s.stepperCircleBtnAdd} onPress={() => onUpdateQty(quantity + 1)}>
                        <Ionicons name="add" size={14} color="#000" />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.quantity === nextProps.quantity &&
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.price === nextProps.item.price &&
      prevProps.item.display_price_dh === nextProps.item.display_price_dh &&
      prevProps.item.promotion_label === nextProps.item.promotion_label &&
      prevProps.item.is_available === nextProps.item.is_available
    );
  }
);

/* ══════════════════════════════════════════════════════
   STORE SKELETON — pixel-perfect shimmer, no spinner
   ══════════════════════════════════════════════════════ */
function StoreSkeletonScreen() {
  const insets = useSafeAreaInsets();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [shimmer]);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

  const Block = useCallback(({ w, h, radius = 10, style }: { w: number | string; h: number; radius?: number; style?: object }) => (
    <Animated.View
      style={[
        {
          width: w as number,
          height: h,
          borderRadius: radius,
          backgroundColor: BRAND.BORDER,
          opacity: shimmerOpacity,
        },
        style,
      ]}
    />
  ), [shimmerOpacity]);

  return (
    <View style={[sk.root, { paddingTop: 0 }]}>
      {/* ── Hero image block ── */}
      <Animated.View style={[sk.hero, { opacity: shimmerOpacity }]} />

      {/* ── Fixed back button ghost ── */}
      <View style={[sk.backBtn, { top: insets.top + 12 }]}>
        <Animated.View style={[sk.iconCircle, { opacity: shimmerOpacity }]} />
      </View>

      {/* ── Store info card ── */}
      <View style={sk.infoCard}>
        {/* Logo bubble overlapping hero */}
        <Animated.View style={[sk.logoBubble, { opacity: shimmerOpacity }]} />

        {/* Store name */}
        <Block w="62%" h={22} radius={8} style={{ marginTop: 14, marginLeft: 4 }} />
        <Block w="45%" h={14} radius={6} style={{ marginTop: 8, marginLeft: 4 }} />

        {/* Delivery info chips */}
        <View style={sk.chipsRow}>
          <Animated.View style={[sk.chip, { opacity: shimmerOpacity }]} />
          <Animated.View style={[sk.chip, { width: 90, opacity: shimmerOpacity }]} />
          <Animated.View style={[sk.chip, { width: 70, opacity: shimmerOpacity }]} />
        </View>
      </View>

      {/* ── Category pills row ── */}
      <View style={sk.pillsRow}>
        {[80, 60, 90, 70, 55].map((w, i) => (
          <Animated.View key={i} style={[sk.pill, { width: w, opacity: shimmerOpacity }]} />
        ))}
      </View>

      {/* ── Product rows ── */}
      <View style={sk.productList}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={sk.productRow}>
            <View style={sk.productInfo}>
              <Block w="70%" h={16} radius={7} />
              <Block w="50%" h={13} radius={5} style={{ marginTop: 7 }} />
              <Block w="30%" h={13} radius={5} style={{ marginTop: 7 }} />
            </View>
            <Animated.View style={[sk.productThumb, { opacity: shimmerOpacity }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.BG },
  hero: {
    width: SCREEN_W,
    height: 220,
    backgroundColor: BRAND.LIGHT,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.BORDER,
  },
  infoCard: {
    backgroundColor: BRAND.SURFACE,
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  logoBubble: {
    position: 'absolute',
    top: -22,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: BRAND.LIGHT,
    borderWidth: 2,
    borderColor: BRAND.BG,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    height: 28,
    width: 110,
    borderRadius: 99,
    backgroundColor: BRAND.LIGHT,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  pill: {
    height: 34,
    borderRadius: 99,
    backgroundColor: BRAND.LIGHT,
  },
  productList: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 0,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.BORDER,
    gap: 12,
  },
  productInfo: {
    flex: 1,
    gap: 0,
  },
  productThumb: {
    width: 88,
    height: 88,
    borderRadius: 14,
    backgroundColor: BRAND.LIGHT,
  },
});



function ProductDetailSheet({
  item,
  visible,
  onClose,
  onConfirm,
  storeName,
  initialCartItem,
  isEditing,
  storeRating,
  storeRatingCount,
}: {
  item: any;
  visible: boolean;
  onClose: () => void;
  onConfirm: (item: any, qty: number, options: any[]) => void;
  storeName?: string;
  initialCartItem?: any;
  isEditing?: boolean;
  storeRating?: number;
  storeRatingCount?: number;
}) {
  const insets = useSafeAreaInsets();
  const { lang, isRTL } = useLangStore();
  const [qty, setQty] = useState(1);

  // Normalize option groups so any schema variation (supplements, options, choices) is supported
  const groups = useMemo(
    () => normalizeMobileOptionGroups(item?.option_groups || item?.options || []),
    [item?.option_groups, item?.options],
  );

  const [selections, setSelections] = useState<ProductSelections>({});

  // Custom sheet transition animated value
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const qtyScaleAnim = useRef(new Animated.Value(1)).current;

  // Reset state and trigger entry animation when visible changes
  useEffect(() => {
    if (visible && item) {
      setQty(Math.min(50, Math.max(1, Number(initialCartItem?.quantity) || 1)));
      setSelections(restoreProductSelections(groups, initialCartItem?.selected_options || []));

      sheetAnim.setValue(0);
      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [groups, visible, item?.id, initialCartItem?.id]);

  // Spring pop animation on quantity change
  useEffect(() => {
    qtyScaleAnim.setValue(0.92);
    Animated.spring(qtyScaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [qty]);

  const handleClose = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const selectionsValid = useMemo(
    () => productSelectionsAreValid(groups, selections),
    [groups, selections],
  );

  const allSelectedOptions = useMemo(() => {
    const list: any[] = [];
    groups.forEach((group) => {
      const selectedChoiceIds = selections[group.id] || [];
      group.choices.forEach((choice) => {
        if (selectedChoiceIds.includes(choice.id)) {
          const choiceName = choice.label_ar && choice.label && choice.label_ar !== choice.label
            ? `${choice.label_ar}|${choice.label}`
            : choice.label_ar || choice.label;
          list.push({
            id: choice.id,
            name: choiceName,
            price_delta: choice.price_delta_dh,
            option_id: group.id,
            option_label: group.label || group.label_ar || '',
            choice_id: choice.id,
            choice_name: choiceName,
          });
        }
      });
    });
    return list;
  }, [groups, selections]);

  // All price derivations in a single memo — only re-runs when options, qty, or item changes
  // Must be before any early return to satisfy React Rules of Hooks
  const { basePrice, optionsDelta, totalPriceDh, buttonText } = useMemo(() => {
    const base = Number(item?.display_price_dh ?? item?.price_dh ?? item?.price ?? item?.unit_price ?? 0);
    const delta = allSelectedOptions.reduce((sum: number, opt: any) => sum + (Number(opt.price_delta) || 0), 0);
    const total = (base + delta) * qty;
    const formatted = money(total);
    const text = isEditing
      ? (lang === 'ar' ? `تحديث المنتج  •  ${formatted}` : lang === 'en' ? `Update item  •  ${formatted}` : `Mettre à jour  •  ${formatted}`)
      : (lang === 'ar' ? `إضافة إلى السلة  •  ${formatted}` : lang === 'en' ? `Add to cart  •  ${formatted}` : `Ajouter au panier  •  ${formatted}`);
    return { basePrice: base, optionsDelta: delta, totalPriceDh: total, buttonText: text };
  }, [allSelectedOptions, qty, isEditing, lang, item]);

  if (!item) return null;

  const backdropOpacity = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
    extrapolate: 'clamp',
  });

  const containerTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_H * 0.9, 0],
    extrapolate: 'clamp',
  });

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
      <View style={s.sheetOverlay}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: backdropOpacity }]} />
        <Pressable style={s.sheetBackdrop} onPress={handleClose} />

        <Animated.View
          style={[
            s.sheetContainer,
            {
              paddingBottom: insets.bottom,
              transform: [{ translateY: containerTranslateY }],
            },
          ]}
        >
          <View style={s.sheetHandle}>
            <View style={s.sheetHandleBar} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.sheetScroll}
            bounces={false}
          >
            <View style={s.sheetImageWrap}>
              <Image
                source={{ uri: resolveStoreImageUrl(item.image_url, FALLBACK_ITEM) }}
                style={s.sheetImage}
                contentFit="cover"
              />
              <Pressable
                style={[
                  s.sheetCloseBtn,
                  isRTL ? { right: px(16), left: undefined } : { left: px(16), right: undefined }
                ]}
                onPress={handleClose}
              >
                <Ionicons name="arrow-back" size={20} color="#111827" />
              </Pressable>
              <View
                style={[
                  s.sheetImageActions,
                  isRTL ? { left: px(16), right: undefined } : { right: px(16), left: undefined }
                ]}
              >
                <Pressable style={s.sheetActionBtn}>
                  <Ionicons name="share-social-outline" size={18} color="#111827" />
                </Pressable>
                <Pressable style={s.sheetActionBtn}>
                  <Ionicons name="heart-outline" size={18} color="#111827" />
                </Pressable>
              </View>
            </View>

            <Text style={[s.sheetTitle, { textAlign: dirText(isRTL) }]}>
              {lang === 'ar' ? (item.name_ar || item.name) : parseBilingualText(item.name, lang, item.name_ar)}
            </Text>
            {storeName && (
              <Text style={[s.sheetStoreName, { textAlign: dirText(isRTL) }]}>
                {storeName}
              </Text>
            )}
            
            {(storeRating != null && storeRating > 0) && (
              <View style={[s.sheetRatingRow, { flexDirection: dirRow(isRTL), justifyContent: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={s.sheetRatingText}>{storeRating.toFixed(1)}</Text>
                {storeRatingCount != null && storeRatingCount > 0 && (
                  <Text style={s.sheetRatingCount}>({storeRatingCount} {lang === 'ar' ? 'تقييم' : 'avis'})</Text>
                )}
              </View>
            )}

            <Text style={[s.sheetDesc, { textAlign: dirText(isRTL) }]}>
              {lang === 'ar' ? (item.description_ar || item.description || '') : parseBilingualText(item.description, lang, item.description_ar || '')}
            </Text>

            {/* Render all Option Groups & Supplements */}
            {groups.map((group) => {
              const groupTitle = lang === 'ar' ? (group.label_ar || group.label) : group.label;
              const isMultiple = group.multiple;
              const isRequired = group.required || group.min_selections > 0;

              if (!isMultiple) {
                // Obligatory Single Choice -> Horizontal Size / Choice Box Cards
                return (
                  <View key={group.id} style={s.optionGroup}>
                    <View style={[s.optionGroupHeader, { flexDirection: dirRow(isRTL) }]}>
                      <Text style={[s.optionGroupTitle, { textAlign: dirText(isRTL) }]}>
                        {groupTitle}
                      </Text>
                      <View style={[s.badgeTag, isRequired ? s.badgeRequired : s.badgeOptional]}>
                        <Text style={[s.badgeTagText, isRequired ? s.badgeRequiredText : s.badgeOptionalText]}>
                          {isRequired 
                            ? (lang === 'ar' ? 'مطلوب (اختيار 1)' : 'Obligatoire (1 choix)')
                            : (lang === 'ar' ? 'اختياري' : 'Optionnel')}
                        </Text>
                      </View>
                    </View>

                    <View style={[s.sizeBoxRow, { flexDirection: dirRow(isRTL) }]}>
                      {group.choices.map((choice) => {
                        const selected = (selections[group.id] || []).includes(choice.id);
                        const choiceTitle = lang === 'ar' ? (choice.label_ar || choice.label) : choice.label;
                        const priceText = choice.price_delta_dh > 0 
                          ? `+${money(choice.price_delta_dh)}` 
                          : (lang === 'ar' ? 'مجاناً' : 'Inclus');

                        return (
                          <Pressable
                            key={choice.id}
                            style={({ pressed }) => [
                              s.sizeBoxCard,
                              selected ? s.sizeBoxCardSelected : s.sizeBoxCardUnselected,
                              pressed && { opacity: 0.85 },
                            ]}
                            onPress={() => setSelections(cur => selectProductChoice(cur, group, choice.id))}
                          >
                            <View style={[s.radioDot, selected && s.radioDotSelected]}>
                              {selected && <View style={s.radioDotInner} />}
                            </View>
                            <Text style={[s.sizeBoxTitle, selected && s.sizeBoxTitleSelected]} numberOfLines={1}>
                              {choiceTitle}
                            </Text>
                            <Text style={[s.sizeBoxPrice, selected && s.sizeBoxPriceSelected]}>
                              {priceText}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              }

              // Multiple Choice -> Clean Checkbox Row List (Supplements / Extras)
              return (
                <View key={group.id} style={s.optionGroup}>
                  <View style={[s.optionGroupHeader, { flexDirection: dirRow(isRTL) }]}>
                    <Text style={[s.optionGroupTitle, { textAlign: dirText(isRTL) }]}>
                      {groupTitle}
                    </Text>
                    <View style={[s.badgeTag, s.badgeOptional]}>
                      <Text style={[s.badgeTagText, s.badgeOptionalText]}>
                        {lang === 'ar' ? 'إضافات (اختياري)' : 'Suppléments (Optionnel)'}
                      </Text>
                    </View>
                  </View>

                  <View style={s.suppListCard}>
                    {group.choices.map((choice, idx) => {
                      const checked = (selections[group.id] || []).includes(choice.id);
                      const choiceTitle = lang === 'ar' ? (choice.label_ar || choice.label) : choice.label;
                      const isLast = idx === group.choices.length - 1;
                      return (
                        <Pressable
                          key={choice.id}
                          style={({ pressed }) => [
                            s.suppRow,
                            !isLast && s.suppRowBorder,
                            { flexDirection: dirRow(isRTL) },
                            pressed && { opacity: 0.7 }
                          ]}
                          onPress={() => setSelections(cur => selectProductChoice(cur, group, choice.id))}
                        >
                          <View style={{ flexDirection: dirRow(isRTL), alignItems: 'center', gap: 12 }}>
                            <View style={[s.suppCheckbox, checked && s.suppCheckboxChecked]}>
                              {checked && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                            </View>
                            <Text style={[s.suppLabel, checked && s.suppLabelChecked, { textAlign: dirText(isRTL) }]}>
                              {choiceTitle}
                            </Text>
                          </View>
                          <Text style={[s.suppPrice, choice.price_delta_dh === 0 && s.suppPriceFree]}>
                            {choice.price_delta_dh > 0 ? `+${money(choice.price_delta_dh)}` : (lang === 'ar' ? 'مجاناً' : 'Gratuit')}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            <View style={{ height: px(120) }} />
          </ScrollView>

          {/* Sticky Bottom Action Bar */}
          <View style={[s.sheetBottom, { paddingBottom: Math.max(insets.bottom, px(16)), flexDirection: dirRow(isRTL) }]}>
            {/* Quantity Stepper */}
            <View style={[s.qtyStepper, { flexDirection: dirRow(isRTL) }]}>
              <Pressable
                style={s.qtyStepperBtn}
                onPress={() => setQty(q => Math.max(1, q - 1))}
              >
                <Ionicons name="remove" size={18} color="#111827" />
              </Pressable>
              <Text style={s.qtyText}>{qty}</Text>
              <Pressable
                style={s.qtyStepperBtn}
                onPress={() => setQty(q => q + 1)}
              >
                <Ionicons name="add" size={18} color="#111827" />
              </Pressable>
            </View>

            {/* Main Action Button */}
            <Pressable
              style={({ pressed }) => [
                s.addToCartBtn,
                !selectionsValid && { opacity: 0.5 },
                pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
              ]}
              onPress={() => {
                if (!selectionsValid) return;
                onConfirm(item, qty, allSelectedOptions);
              }}
              disabled={!selectionsValid}
            >
              <Animated.Text style={[s.addToCartBtnText, { transform: [{ scale: qtyScaleAnim }] }]}>
                {buttonText}
              </Animated.Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ── Main Screen ──────────────────────────────────────────── */
export default function StoreProductsScreen() {
  const router = useRouter();
  const { id, editMenuItemId, editCartItemId } = useLocalSearchParams<{ id: string; editMenuItemId?: string; editCartItemId?: string }>();
  const insets = useSafeAreaInsets();
  const { t, lang, isRTL } = useLangStore();
  const user = useAuthStore(s => s.user);
  const addItem = useCartStore(s => s.addItem);
  const replaceItem = useCartStore(s => s.replaceItem);
  const updateQuantity = useCartStore(s => s.updateQuantity);
  const setStore = useCartStore(s => s.setStore);
  const replaceActiveStore = useCartStore(s => s.replaceActiveStore);
  const cartItems = useCartStore(s => s.items);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const scrollRef = useRef<ScrollView>(null);
  const categoryScrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const categoryY = useRef<Record<string, number>>({});

  const { data: storeData, isLoading: storeLoading } = useStoreQuery(id ?? '');
  const { data: menuData, isLoading: menuLoading } = useStoreMenuQuery(id ?? '');

  const store = storeData ?? null;
  const loading = storeLoading || menuLoading;
  const schedule = useMemo(() => isStoreCurrentlyOpen(store), [store]);

  const [isFav, setIsFav] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('popular');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingCartItem, setEditingCartItem] = useState<any>(null);
  const editOpened = useRef(false);

  // Layout-driven metrics for smooth scrolling and sticky pinning
  const [categoryThreshold, setCategoryThreshold] = useState(0);

  // Sliding active indicator bubble
  const pillMeasurements = useRef<Record<string, { x: number; width: number }>>({});
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const hasInitializedIndicator = useRef(false);

  // Process menu data — filter out empty categories
  const categories = useMemo(() => {
    return (menuData ?? []).filter((c: any) => c.items?.length);
  }, [menuData]);

  useEffect(() => {
    const meas = pillMeasurements.current[activeCategory];
    if (meas) {
      if (!hasInitializedIndicator.current) {
        indicatorX.setValue(meas.x);
        indicatorWidth.setValue(meas.width);
        hasInitializedIndicator.current = true;
      } else {
        Animated.parallel([
          Animated.timing(indicatorX, {
            toValue: meas.x,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(indicatorWidth, {
            toValue: meas.width,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]).start();
      }
    }
  }, [activeCategory, categories]);

  // Initialize activeCategory when categories first load
  useEffect(() => {
    if (categories.length > 0 && categories[0]?.id) {
      setActiveCategory(String(categories[0].id));
    }
  }, [categories]);

  // Favourite check — user-specific, not part of store cache
  useEffect(() => {
    if (!user?.id || !id) return;
    checkFavorite(user.id, id).then((fav) => setIsFav(Boolean(fav))).catch(() => {});
  }, [user?.id, id]);

  useEffect(() => {
    LayoutAnimation.configureNext({
      duration: 220,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
  }, [activeCategory]);

  const menuGroups = useMemo(() => {
    return categories;
  }, [categories]);

  useEffect(() => {
    if (editOpened.current || loading || !editMenuItemId || !editCartItemId) return;
    const menuItem = categories.flatMap((category: any) => category.items || []).find((item: any) => String(item.id) === String(editMenuItemId));
    const cartItem = cartItems.find((item) => (item.cart_line_id || item.id) === editCartItemId);
    if (!menuItem || !cartItem) return;
    editOpened.current = true;
    setEditingCartItem(cartItem);
    setSelectedItem(menuItem);
  }, [cartItems, categories, editCartItemId, editMenuItemId, loading]);

  const closesAt = useMemo(() => {
    try {
      const raw = store?.opening_hours;
      if (!raw) return '23:00';
      const hours = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const today = hours?.[keys[new Date().getDay()]];
      return today?.close || '23:00';
    } catch {
      return '23:00';
    }
  }, [store?.opening_hours]);

  const storePromoDisplay = useMemo(() => {
    const promoType = String(store?.promo_type || '').trim();
    const hasStorePromo = Boolean(store?.has_reduction) || (promoType.length > 0 && promoType !== 'none');
    if (!hasStorePromo) return null;

    const amount = Number(store?.reduction_percentage || 0);
    const amountLabel = promoType === 'store_fixed' && amount > 0
      ? `${amount} DH`
      : amount > 0
        ? `${amount}%`
        : (lang === 'ar' ? 'عرض' : lang === 'en' ? 'Offer' : 'Promo');
    const wholeStore = promoType === 'store_percentage' || promoType === 'store_fixed';
    const scopeLabel = wholeStore
      ? (lang === 'ar' ? 'على المتجر كامل' : lang === 'en' ? 'on the whole store' : 'sur toute la boutique')
      : (lang === 'ar' ? 'على منتجات مختارة' : lang === 'en' ? 'on selected products' : 'sur certains produits');

    return { amountLabel, scopeLabel };
  }, [lang, store?.has_reduction, store?.promo_type, store?.reduction_percentage]);

  const favScale = useRef(new Animated.Value(1)).current;

  /* ── Actions ───────────────────────────────────────── */
  const addToCartLegacy = (item: any, qty: number = 1, options: any[] = []) => {
    if (!id) return;
    const sName = store?.name_ar || store?.name || 'روز باتيسري';
    setStore(id, sName, store?.logo_url);
    addItem({
      id: item.id,
      menu_item_id: item.id,
      name: item.name || item.name_ar || '',
      name_ar: item.name_ar || item.name || '',
      store_id: id,
      unit_price: 0,
      quantity: qty,
      image_url: item.image_url || FALLBACK_ITEM,
      selected_options: options,
    });
  };

  const addToCart = (item: any, qty: number = 1, options: any[] = []) => {
    if (!id) return;
    const storeNameForCart = store?.name_ar || store?.name;
    if (!storeNameForCart) return;
    const line = {
      id: item.id,
      menu_item_id: item.id,
      name: item.name || item.name_ar || '',
      name_ar: item.name_ar || item.name || '',
      store_id: id,
      unit_price: 0,
      quantity: qty,
      image_url: item.image_url || undefined,
      selected_options: options,
    };
    if (setStore(id, storeNameForCart, store?.logo_url)) {
      addItem(line);
      return;
    }
    Alert.alert(
      'Votre panier',
      'Votre panier contient des articles d’un autre commerce. Commencer un nouveau panier supprimera uniquement ce panier actif.',
      [
        { text: 'Garder mon panier', style: 'cancel' },
        {
          text: 'Nouveau panier',
          style: 'destructive',
          onPress: () => {
            replaceActiveStore(id, storeNameForCart, store?.logo_url);
            addItem(line);
          },
        },
      ],
    );
  };

  const handleSheetConfirm = (item: any, qty: number, options: any[]) => {
    if (editingCartItem) {
      replaceItem(editingCartItem.cart_line_id || editingCartItem.id, {
        ...editingCartItem,
        menu_item_id: item.id,
        quantity: qty,
        selected_options: options,
        image_url: item.image_url || undefined,
      });
      setEditingCartItem(null);
      setSelectedItem(null);
      if (router.canGoBack()) router.back();
      else router.replace({ pathname: '/(tabs)/cart' });
      return;
    }
    addToCart(item, qty, options);
    setSelectedItem(null);
  };

  const handleFavorite = async () => {
    if (!user?.id || !id) return;

    // Optimistic UI update: toggle state and trigger animation instantly
    const nextFav = !isFav;
    setIsFav(nextFav);

    favScale.setValue(1);
    Animated.sequence([
      Animated.timing(favScale, { toValue: 1.35, duration: 80, useNativeDriver: true }),
      Animated.spring(favScale, { toValue: 1, friction: 3.5, useNativeDriver: true }),
    ]).start();

    try {
      const result = await toggleFavorite(user.id, id);
      if (result.data === null) {
        setIsFav(!nextFav); // Revert on failure
      }
    } catch (error) {
      setIsFav(!nextFav); // Revert on error
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `جرب هذا المطعم المميز: ${storeName} على تطبيق جاهز!`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Section tracking: detect visible section offset accurately
    const y = event.nativeEvent.contentOffset.y + insets.top + px(72) + px(58);
    let current = String(menuGroups[0]?.id || 'popular');
    for (const group of menuGroups) {
      const key = String(group.id);
      if ((categoryY.current[key] ?? 0) <= y) current = key;
    }
    if (current !== activeCategory) setActiveCategory(current);
  };

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const y = categoryY.current[categoryId];
    if (typeof y === 'number') {
      const offset = insets.top + px(72) + px(48);
      scrollRef.current?.scrollTo({ y: Math.max(0, y - offset), animated: true });
    }
  };

  /* ── Loading — skeleton screen ──────────────────────────────── */
  if (loading) return <StoreSkeletonScreen />;

  /* ── Derived data ─────────────────────────── */
  const storeName   = lang === 'ar' ? (store?.name_ar || store?.name || '') : parseBilingualText(store?.name || '', lang, store?.name_ar || '');
  const storeAddress = lang === 'ar' ? (store?.address_ar || store?.address || '') : (store?.address || store?.address_ar || '');
  const cover       = resolveStoreImageUrl(store?.cover_url || store?.logo_url, FALLBACK_COVER);
  const logo        = store?.logo_url ? resolveStoreImageUrl(store.logo_url, '') : undefined;
  const deliveryFee = Number(store?.delivery_fee || 0);
  const deliveryMin = store?.delivery_time_min || null;
  const deliveryMax = store?.delivery_time_max || null;
  const rating      = Number(store?.rating_avg || 0);

  /* ── Scroll-driven animations ──────────────────── */
  const HERO_H = px(240);
  const HEADER_HEIGHT = insets.top + px(60);

  // Navigation background starts fading from transparent to solid white at scroll ≈20% of HERO_H
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [HERO_H * 0.2, HERO_H],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [HERO_H * 0.35, HERO_H * 0.75],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });


  // Hero image leaves: opacity drops through 100% -> 85% -> 70% -> 55% -> 40% -> 20% -> 0%
  const heroFade = scrollY.interpolate({
    inputRange: [0, HERO_H * 0.2, HERO_H * 0.4, HERO_H * 0.6, HERO_H * 0.8, HERO_H * 0.9, HERO_H],
    outputRange: [1, 0.85, 0.70, 0.55, 0.40, 0.20, 0],
    extrapolate: 'clamp',
  });

  // Parallax effect: image moves at approximately 0.65x scroll speed
  const heroTranslate = scrollY.interpolate({
    inputRange: [0, HERO_H],
    outputRange: [0, HERO_H * 0.35],
    extrapolate: 'clamp',
  });

  // Category bar pinning: lifts the inline category row under the fixed header.
  const thresholdY = categoryThreshold > 0 ? categoryThreshold - HEADER_HEIGHT : 0;
  const categoryTranslateY = scrollY.interpolate({
    inputRange: [0, Math.max(1, thresholdY), Math.max(1, thresholdY) + 1],
    outputRange: [0, 0, 1],
    extrapolateLeft: 'clamp',
  });

  /* ── Render ────────────────────────────────── */
  return (
    <View style={s.root}>
      {/* ─── Scrollable body ───────────────────── */}
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true, listener: handleScroll }
        )}
        contentContainerStyle={{ paddingBottom: cartItemCount > 0 ? px(176) : px(128) }}
      >
        {/* ── Hero image ───────────────────────── */}
        <Animated.View style={[s.heroWrap, { opacity: heroFade, transform: [{ translateY: heroTranslate }] }]}>
          <View style={s.heroClip}>
            <Image source={{ uri: cover }} style={s.coverImg} contentFit="cover" />
          </View>
          <View style={[s.logoOverlay, isRTL ? { left: SIDE + px(8), right: undefined } : { right: SIDE + px(8), left: undefined }]}>
            {logo
              ? <Image source={{ uri: logo }} style={s.logoImg} contentFit="cover" />
              : <Text style={s.logoText}>Rosé</Text>}
          </View>
        </Animated.View>

        {/* ── Store info panel ─────────────────── */}
        <View style={s.infoPanel}>
          <View style={[s.storeTitleBlock, { alignItems: dirItems(isRTL) }]}>
            <Text style={[s.storeHeroName, { textAlign: dirText(isRTL) }]} numberOfLines={2}>
              {storeName}
            </Text>
            {!!storeAddress && (
              <View style={[s.storeInfoLine, { flexDirection: dirRow(isRTL) }]}>
                <Ionicons name="location-outline" size={px(15)} color={BRAND.TEXT2} />
                <Text style={[s.storeInfoText, { textAlign: dirText(isRTL) }]} numberOfLines={1}>
                  {storeAddress}
                </Text>
              </View>
            )}
            <View style={[s.storeInfoLine, { flexDirection: dirRow(isRTL) }]}>
              <Ionicons name="bicycle-outline" size={px(15)} color={BRAND.RED} />
              <Text style={[s.storeInfoText, { textAlign: dirText(isRTL) }]} numberOfLines={1}>
                {lang === 'ar' ? 'رسوم التوصيل' : 'Frais de livraison'} {money(deliveryFee)}
              </Text>
            </View>
            {storePromoDisplay && (
              <View style={[s.storePromoLine, { flexDirection: dirRow(isRTL) }]}>
                <View style={s.storePromoIcon}>
                  <Ionicons name="pricetag-outline" size={px(14)} color={BRAND.TEXT} />
                </View>
                <View style={[s.storePromoCopy, { alignItems: dirItems(isRTL) }]}>
                  <Text style={[s.storePromoAmount, { textAlign: dirText(isRTL) }]} numberOfLines={1}>
                    {storePromoDisplay.amountLabel}
                  </Text>
                  <Text style={[s.storePromoScope, { textAlign: dirText(isRTL) }]} numberOfLines={1}>
                    {storePromoDisplay.scopeLabel}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {!schedule.isOpen && (() => {
            const scheduleDetail = require('../../../lib/storeStatus').getStoreScheduleStatus(store?.opening_hours);
            let nextOpeningLabel = '';
            if (scheduleDetail && scheduleDetail.nextOpening) {
              const { dayFr, dayAr, time } = scheduleDetail.nextOpening;
              nextOpeningLabel = lang === 'ar'
                ? `يفتح ${dayAr} في ${time}`
                : `Ouvre ${dayFr} à ${time}`;
            } else {
              nextOpeningLabel = lang === 'ar' ? 'مغلق حالياً' : 'Fermé actuellement';
            }

            const showOpeningHours = () => {
              if (!store?.opening_hours) return;
              try {
                const { Alert } = require('react-native');
                const sched = typeof store.opening_hours === 'string' ? JSON.parse(store.opening_hours) : store.opening_hours;
                const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                const dayNamesFr = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
                const dayNamesAr = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
                
                const scheduleLines = days.map((day, idx) => {
                  const item = sched[day];
                  const label = lang === 'ar' ? dayNamesAr[idx] : dayNamesFr[idx];
                  if (!item || item.is_closed) {
                    return `${label}: ${lang === 'ar' ? 'مغلق' : 'Fermé'}`;
                  }
                  return `${label}: ${item.open} - ${item.close}`;
                });

                Alert.alert(
                  lang === 'ar' ? 'أوقات العمل' : 'Heures d’ouverture',
                  scheduleLines.join('\n'),
                  [{ text: lang === 'ar' ? 'موافق' : 'OK' }]
                );
              } catch (e) {
                console.log(e);
              }
            };

            return (
              <View style={s.closedBannerCard}>
                <View style={{ flexDirection: dirRow(isRTL), alignItems: 'center', gap: px(10) }}>
                  <View style={s.closedBannerIconCircle}>
                    <Ionicons name="time" size={px(20)} color="#E11D48" />
                  </View>
                  <View style={{ alignItems: dirItems(isRTL) }}>
                    <Text style={s.closedBannerCardTitle}>
                      {lang === 'ar' ? 'مغلق' : 'Fermé'}
                    </Text>
                    <Text style={s.closedBannerCardSubtitle}>
                      {nextOpeningLabel}
                    </Text>
                  </View>
                </View>

                <Text style={[s.closedBannerCardBody, { textAlign: dirText(isRTL), marginTop: px(12) }]}>
                  {lang === 'ar'
                    ? 'يمكنك تصفح القائمة، ولكن لا يمكنك تقديم طلبات حالياً.'
                    : 'Vous pouvez consulter le menu, mais vous ne pouvez pas passer de commande.'}
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    s.closedBannerHoursBtn,
                    pressed && { opacity: 0.8 }
                  ]}
                  onPress={showOpeningHours}
                >
                  <Text style={s.closedBannerHoursBtnText}>
                    {lang === 'ar' ? 'عرض أوقات العمل' : 'Voir les heures d’ouverture'}
                  </Text>
                </Pressable>
              </View>
            );
          })()}

        </View>

        {/* ── Category pills (inline — pins when it hits header) ── */}
        {menuGroups.length > 0 && (() => {
          const getCategoryIconUrl = (name: string): string => {
            const str = (name || '').toLowerCase();
            // Pharmacy Categories
            if (str.includes('أدوية') || str.includes('médicaments') || str.includes('pharm') || str.includes('pill') || str.includes('drogue')) {
              return 'https://img.icons8.com/clouds/100/pill.png';
            }
            if (str.includes('طفل') || str.includes('bébé') || str.includes('baby')) {
              return 'https://img.icons8.com/clouds/100/baby-bottle.png';
            }
            if (str.includes('تجميل') || str.includes('بشرة') || str.includes('cosmétique') || str.includes('beauté') || str.includes('makeup') || str.includes('skin')) {
              return 'https://img.icons8.com/clouds/100/cosmetics.png';
            }
            if (str.includes('فيتامين') || str.includes('vitamin') || str.includes('médical') || str.includes('supplément')) {
              return 'https://img.icons8.com/clouds/100/vitamin-c.png';
            }
            if (str.includes('نظافة') || str.includes('إسعاف') || str.includes('hygiène') || str.includes('soins') || str.includes('first aid') || str.includes('care') || str.includes('soap')) {
              return 'https://img.icons8.com/clouds/100/bar-of-soap.png';
            }

            // Grocery Categories
            if (str.includes('خضروات') || str.includes('فواكه') || str.includes('fruit') || str.includes('légume') || str.includes('vegan') || str.includes('apple')) {
              return 'https://img.icons8.com/clouds/100/apple.png';
            }
            if (str.includes('ألبان') || str.includes('بيض') || str.includes('lait') || str.includes('oeuf') || str.includes('dairy') || str.includes('cheese') || str.includes('milk')) {
              return 'https://img.icons8.com/clouds/100/cheese.png';
            }
            if (str.includes('مخبز') || str.includes('خبز') || str.includes('bakery') || str.includes('pain') || str.includes('croissant') || str.includes('boulangerie')) {
              return 'https://img.icons8.com/clouds/100/croissant.png';
            }
            if (str.includes('حلويات') || str.includes('مقبلات') || str.includes('sweet') || str.includes('dessert') || str.includes('cake') || str.includes('confiserie') || str.includes('snack') || str.includes('cookie')) {
              return 'https://img.icons8.com/clouds/100/cake.png';
            }
            if (str.includes('منظفات') || str.includes('clean') || str.includes('nettoyage') || str.includes('detergent') || str.includes('spray')) {
              return 'https://img.icons8.com/clouds/100/window-cleaner.png';
            }
            if (str.includes('معلبات') || str.includes('conserve') || str.includes('can')) {
              return 'https://img.icons8.com/clouds/100/canned-food.png';
            }
            if (str.includes('لحوم') || str.includes('دواجن') || str.includes('boucherie') || str.includes('meat') || str.includes('chicken') || str.includes('steak')) {
              return 'https://img.icons8.com/clouds/100/steak.png';
            }

            // Food & Restaurant Categories
            if (str.includes('تاكو') || str.includes('taco')) {
              return 'https://img.icons8.com/clouds/100/taco.png';
            }
            if (str.includes('بيتزا') || str.includes('pizza')) {
              return 'https://img.icons8.com/clouds/100/pizza.png';
            }
            if (str.includes('برجر') || str.includes('burger')) {
              return 'https://img.icons8.com/clouds/100/hamburger.png';
            }
            if (str.includes('إيطالي') || str.includes('pasta') || str.includes('spaghetti') || str.includes('pâte')) {
              return 'https://img.icons8.com/clouds/100/spaghetti.png';
            }
            if (str.includes('آسيوي') || str.includes('sushi') || str.includes('asiatique')) {
              return 'https://img.icons8.com/clouds/100/sushi.png';
            }
            if (str.includes('سريع') || str.includes('fast') || str.includes('frite') || str.includes('french fries')) {
              return 'https://img.icons8.com/clouds/100/french-fries.png';
            }
            if (str.includes('مغربي') || str.includes('tajine') || str.includes('soup') || str.includes('حريرة') || str.includes('طاجين')) {
              return 'https://img.icons8.com/clouds/100/soup-plate.png';
            }
            if (str.includes('صحي') || str.includes('sain') || str.includes('salad') || str.includes('سلطة')) {
              return 'https://img.icons8.com/clouds/100/salad.png';
            }
            if (str.includes('كريب') || str.includes('وافل') || str.includes('crêpe') || str.includes('gaufre') || str.includes('pancake')) {
              return 'https://img.icons8.com/clouds/100/pancakes.png';
            }
            if (str.includes('سمك') || str.includes('بحرية') || str.includes('poisson') || str.includes('fish') || str.includes('seafood')) {
              return 'https://img.icons8.com/clouds/100/fish-food.png';
            }
            if (str.includes('سندويش') || str.includes('sandwich')) {
              return 'https://img.icons8.com/clouds/100/sandwich.png';
            }
            if (str.includes('فطور') || str.includes('قهوة') || str.includes('café') || str.includes('coffee') || str.includes('petit déjeuner')) {
              return 'https://img.icons8.com/clouds/100/coffee-cup.png';
            }
            if (str.includes('عصائر') || str.includes('jus') || str.includes('juice')) {
              return 'https://img.icons8.com/clouds/100/orange-juice.png';
            }
            if (str.includes('مشروبات') || str.includes('boisson') || str.includes('drink') || str.includes('soda') || str.includes('eau')) {
              return 'https://img.icons8.com/clouds/100/soda-bottle.png';
            }
            if (str.includes('مثلجات') || str.includes('بوظة') || str.includes('glace') || str.includes('ice cream')) {
              return 'https://img.icons8.com/clouds/100/ice-cream-cone.png';
            }

            return 'https://img.icons8.com/clouds/100/food.png';
          };

          return (
            <Animated.View
              style={[
                s.fixedCategoryBar,
                {
                  transform: [{ translateY: categoryTranslateY }],
                },
              ]}
              onLayout={(e) => {
                if (categoryThreshold === 0) {
                  setCategoryThreshold(e.nativeEvent.layout.y);
                }
              }}
            >
              <View style={{ flexDirection: dirRow(isRTL), alignItems: 'center' }}>
                <ScrollView
                  ref={categoryScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[s.categoryPillsContainer, { flexDirection: dirRow(isRTL) }]}
                >
                  {menuGroups.map((group: any, index: number) => {
                    const gKey = String(group.id);
                    const active = activeCategory === gKey;
                    const catLabel = categoryName(group, index, lang);
                    return (
                      <Pressable
                        key={gKey}
                        style={({ pressed }) => [
                          s.categoryPill,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          scrollToCategory(gKey);
                        }}
                      >
                        <Text style={[s.categoryPillText, active && s.categoryPillTextActive]}>
                          {catLabel}
                        </Text>
                        <View style={[s.categoryUnderline, active && s.categoryUnderlineActive]} />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </Animated.View>
          );
        })()}

        {/* ── Menu content ─────────────────────── */}
        {(() => {
          const isPharmacy = (store?.category || '').toLowerCase().includes('pharm') || (store?.name_ar || '').includes('صيدل') || (store?.name || '').toLowerCase().includes('pharm');
          const recommImages = isPharmacy
            ? [
                'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80&fit=crop', // Pill pack
                'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=80&fit=crop', // Stethoscope
                'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=80&fit=crop', // Medicine bottle
              ]
            : [
                'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=80&fit=crop', // Chocolate cake
                'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=80&fit=crop', // Cupcake
                'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=80&fit=crop', // Coffee/Dessert
              ];

          return (
            <View style={s.menuList}>
              {/* Recommandé pour vous yellow promo banner */}
              <View style={s.recommSection}>
                <Pressable style={[s.recommCard, { flexDirection: dirRow(isRTL) }]} onPress={() => alert(lang === 'ar' ? 'القائمة المميزة' : 'Menu recommandé')}>
                  <View style={[s.recommTextWrap, { alignItems: dirItems(isRTL) }]}>
                    <Text style={[s.recommTitle, { textAlign: dirText(isRTL) }]}>
                      {lang === 'ar' ? 'موصى به لك' : 'Recommandé pour vous'}
                    </Text>
                    <Text style={[s.recommSub, { textAlign: dirText(isRTL) }]}>
                      {lang === 'ar' ? 'عملائنا يفضلون هذه المنتجات' : 'Nos clients adorent ces produits'}
                    </Text>
                  </View>

                  <View style={[s.recommRight, { flexDirection: dirRow(isRTL) }]}>
                    <View style={s.recommImagesRow}>
                      <Image source={{ uri: recommImages[0] }} style={[s.recommThumb, { zIndex: 3 }]} />
                      <Image source={{ uri: recommImages[1] }} style={[s.recommThumb, { zIndex: 2 }, isRTL ? { marginRight: px(-14) } : { marginLeft: px(-14) }]} />
                      <Image source={{ uri: recommImages[2] }} style={[s.recommThumb, { zIndex: 1 }, isRTL ? { marginRight: px(-14) } : { marginLeft: px(-14) }]} />
                    </View>
                    <View style={s.recommArrowCircle}>
                      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={14} color="#000" />
                    </View>
                  </View>
                </Pressable>
              </View>

              {menuGroups.map((group: any, groupIndex: number) => {
                const key = String(group.id);
                return (
                  <View
                    key={key}
                    onLayout={(e) => { categoryY.current[key] = e.nativeEvent.layout.y; }}
                    style={s.categorySection}
                  >
                    {groupIndex > 0 && (
                      <Text style={[s.categoryTitle, { textAlign: dirText(isRTL) }]}>{categoryName(group, groupIndex, lang)}</Text>
                    )}
                    {(group.items?.length ? group.items : []).map((item: any, itemIdx: number) => {
                      const directLine = cartItems.find((line) => line.menu_item_id === item.id && !(line.selected_options || []).length);
                      const qty = directLine?.quantity || 0;
                      const isLast = itemIdx === (group.items?.length || 0) - 1;
                      return (
                        <View key={item.id}>
                          <ProductRow
                            item={item}
                            quantity={qty}
                            onAdd={() => setSelectedItem(item)}
                            onUpdateQty={(q) => {
                              if (directLine) updateQuantity(directLine.cart_line_id || directLine.id, q);
                              else setSelectedItem(item);
                            }}
                            disabled={!schedule.isOpen}
                            storeName={store?.name || store?.name_ar}
                            storeCategory={store?.category}
                          />
                          {!isLast && <View style={s.productDivider} />}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          );
        })()}

        {/* ── Ratings tab ──────────────────────── */}
        {false && (
          <View style={s.tabContent}>
            <View style={s.ratingSummary}>
              <Text style={s.ratingBig}>{rating}</Text>
              <Ionicons name="star" size={px(24)} color="#D4A843" />
              <Text style={s.tabMuted}>512 تقييم</Text>
            </View>
            <Text style={s.tabBody}>التقييمات التفصيلية ستظهر هنا عند توفر بيانات العملاء.</Text>
          </View>
        )}

        {/* ── Info tab ────────────────────────── */}
        {false && (
          <View style={s.tabContent}>
            <Text style={[s.infoTitle, { textAlign: dirText(isRTL) }]}>{storeName}</Text>
            
            <View style={s.infoCard}>
              {/* Address Item */}
              <View style={[s.infoRowItem, { flexDirection: dirRow(isRTL) }]}>
                <View style={[s.infoIconWrap, { backgroundColor: '#F3F4F6' }]}>
                  <Ionicons name="location" size={18} color="#6B7280" />
                </View>
                <View style={[s.infoTextWrap, { alignItems: dirItems(isRTL) }]}>
                  <Text style={s.infoRowLabel}>{lang === 'ar' ? 'العنوان' : 'Adresse'}</Text>
                  <Text style={[s.infoRowVal, { textAlign: dirText(isRTL) }]}>
                    {store?.address_ar || store?.address || (lang === 'ar' ? 'العنوان غير متوفر' : lang === 'fr' ? 'Adresse indisponible' : 'Address unavailable')}
                  </Text>
                </View>
              </View>

              <View style={s.infoRowSeparator} />

              {/* Delivery Time Item */}
              <View style={[s.infoRowItem, { flexDirection: dirRow(isRTL) }]}>
                <View style={[s.infoIconWrap, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="time" size={18} color="#0284C7" />
                </View>
                <View style={[s.infoTextWrap, { alignItems: dirItems(isRTL) }]}>
                  <Text style={s.infoRowLabel}>{lang === 'ar' ? 'وقت التوصيل المتوقع' : 'Temps de livraison estimé'}</Text>
                  <Text style={[s.infoRowVal, { textAlign: dirText(isRTL) }]}>
                    {deliveryMin} - {deliveryMax} {t.minutes}
                  </Text>
                </View>
              </View>

              <View style={s.infoRowSeparator} />

              {/* Delivery Fee Item */}
              <View style={[s.infoRowItem, { flexDirection: dirRow(isRTL) }]}>
                <View style={[s.infoIconWrap, { backgroundColor: '#FFE4E6' }]}>
                  <Ionicons name="bicycle" size={18} color={BRAND.RED} />
                </View>
                <View style={[s.infoTextWrap, { alignItems: dirItems(isRTL) }]}>
                  <Text style={s.infoRowLabel}>{lang === 'ar' ? 'رسوم التوصيل' : 'Frais de livraison'}</Text>
                  <Text style={[s.infoRowVal, { textAlign: dirText(isRTL) }]}>
                    {money(deliveryFee)}
                  </Text>
                </View>
              </View>

              <View style={s.infoRowSeparator} />

              {/* Status / Working Hours Item */}
              <View style={[s.infoRowItem, { flexDirection: dirRow(isRTL) }]}>
                <View style={[s.infoIconWrap, schedule.isOpen ? { backgroundColor: '#DCFCE7' } : { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="calendar" size={18} color={schedule.isOpen ? '#15803D' : '#B91C1C'} />
                </View>
                <View style={[s.infoTextWrap, { alignItems: dirItems(isRTL) }]}>
                  <Text style={s.infoRowLabel}>{lang === 'ar' ? 'حالة العمل اليوم' : 'Statut aujourd’hui'}</Text>
                  <Text style={[s.infoRowVal, { textAlign: dirText(isRTL), color: schedule.isOpen ? '#15803D' : '#B91C1C' }]}>
                    {schedule.isOpen 
                      ? (lang === 'ar' ? `مفتوح (يغلق عند ${closesAt})` : `Ouvert (Ferme à ${closesAt})`)
                      : (lang === 'ar' ? 'مغلق حالياً' : 'Fermé actuellement')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* ─── Fixed header (always visible) ───────────── */}
      <Animated.View
        pointerEvents="box-none"
        style={[s.fixedHeader, { height: HEADER_HEIGHT, paddingTop: insets.top, flexDirection: dirRow(isRTL) }]}
      >
        <Animated.View style={[s.fixedHeaderBg, { opacity: headerBgOpacity }]} />

        <HeaderBtn icon={backArrow(isRTL)} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} />

        <View style={s.headerCenter}>
          <Animated.Text
            style={[
              s.storeName,
              {
                opacity: headerTitleOpacity,
              },
            ]}
            numberOfLines={1}
          >
            {storeName}
          </Animated.Text>
        </View>

        <View style={[s.headerRight, isRTL ? { marginRight: 'auto' } : { marginLeft: 'auto' }]}>
          <HeaderBtn icon="share-social-outline" onPress={handleShare} />
          <Animated.View style={{ transform: [{ scale: favScale }] }}>
            <HeaderBtn
              icon={isFav ? 'heart' : 'heart-outline'}
              color={isFav ? BRAND.RED : BRAND.TEXT}
              onPress={handleFavorite}
            />
          </Animated.View>
        </View>
      </Animated.View>

      {cartItemCount > 0 && (
        <View style={[s.cartBar, { bottom: insets.bottom > 0 ? insets.bottom : px(8), flexDirection: dirRow(isRTL) }]}>
          <View style={s.bagIcon}>
            <Ionicons name="briefcase-outline" size={px(24)} color="#fff" />
            <View style={s.bagBadge}><Text style={s.bagBadgeText}>{cartItemCount}</Text></View>
          </View>

          <View style={[s.cartInfo, { alignItems: dirItems(isRTL), paddingLeft: isRTL ? 0 : px(4), paddingRight: isRTL ? px(4) : 0 }]}>
            <Text style={s.cartCount} numberOfLines={1}>
              {lang === 'ar' 
                ? `${cartItemCount} أصناف في السلة`
                : `${cartItemCount} articles dans le panier`}
            </Text>
            <Text style={s.cartSub} numberOfLines={1}>
              {lang === 'ar'
                ? 'عرض السلة والأسعار'
                : 'Voir le panier et les prix'}
            </Text>
          </View>

          <View style={s.cartDivider} />

          <Pressable
            style={({ pressed }) => [
              s.viewCartBtn,
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.95 }
            ]}
            onPress={() => router.push('/(tabs)/cart')}
          >
            <Text style={s.viewCartText}>{lang === 'ar' ? 'عرض السلة' : 'Voir le panier'}</Text>
          </Pressable>
        </View>
      )}

      {/* ─── Product detail sheet ──────────────────────── */}
      <ProductDetailSheet
        item={selectedItem}
        visible={!!selectedItem}
        onClose={() => { setSelectedItem(null); if (editingCartItem) { setEditingCartItem(null); if (router.canGoBack()) router.back(); else router.replace('/(tabs)/cart'); } }}
        onConfirm={handleSheetConfirm}
        storeName={storeName}
        initialCartItem={editingCartItem}
        isEditing={Boolean(editingCartItem)}
        storeRating={rating > 0 ? rating : undefined}
      />
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   STYLES — pixel-perfect recreation of the reference
   ══════════════════════════════════════════════════════ */
const s = StyleSheet.create({
  /* ── Root ───────────────────────────────────────────── */
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },

  /* ── Fixed header ──────────────────────────────────── */
  fixedHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 30,
    height: px(72),
    paddingHorizontal: SIDE,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fixedHeaderBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  headerBtn: {
    width: px(40),
    height: px(40),
    borderRadius: px(20),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 2,
  },
  headerCenter: {
    position: 'absolute',
    left: px(76),
    right: px(76),
    bottom: px(10),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  jaheezLogo: {
    width: px(120),
    height: px(32),
  },
  fixedStoreName: {
    position: 'absolute',
    fontFamily: FONTS.DISPLAY,
    fontSize: px(16),
    color: BRAND.TEXT,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: px(8),
    zIndex: 2,
  },

  /* ── Hero image ────────────────────────────────────── */
  heroWrap: {
    width: SCREEN_W,
    height: px(240),
    position: 'relative',
    marginBottom: px(50),
  },
  heroClip: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: px(22),
    borderBottomRightRadius: px(22),
    overflow: 'hidden',
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  logoOverlay: {
    position: 'absolute',
    bottom: px(-32),
    width: px(78),
    height: px(78),
    borderRadius: px(21),
    backgroundColor: '#C94F74',
    borderWidth: px(2.5),
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    zIndex: 10,
  },
  logoImg: { width: '100%', height: '100%' },
  logoText: { fontFamily: FONTS.DISPLAY, fontSize: px(16), color: '#fff' },

  /* ── Store info ────────────────────────────────────── */
  infoPanel: {
    alignItems: 'stretch',
    paddingHorizontal: SIDE,
    paddingTop: px(2),
    marginBottom: px(16),
  },
  storeTitleBlock: {
    width: '100%',
    gap: px(7),
    marginBottom: px(10),
  },
  storeHeroName: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(28),
    lineHeight: px(34),
    color: '#050505',
  },
  storeInfoLine: {
    alignItems: 'center',
    gap: px(8),
    maxWidth: '100%',
  },
  storeInfoText: {
    flex: 1,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(13),
    lineHeight: px(18),
    color: BRAND.TEXT2,
  },
  storePromoLine: {
    alignItems: 'center',
    gap: px(8),
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginTop: px(2),
    paddingHorizontal: px(10),
    paddingVertical: px(8),
    borderRadius: px(14),
    backgroundColor: BRAND.YELLOW_LIGHT,
    borderWidth: 1,
    borderColor: BRAND.YELLOW,
  },
  storePromoIcon: {
    width: px(26),
    height: px(26),
    borderRadius: px(13),
    backgroundColor: BRAND.YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storePromoCopy: {
    flex: 1,
    minWidth: 0,
    gap: px(1),
  },
  storePromoAmount: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(14),
    lineHeight: px(17),
    color: BRAND.TEXT,
  },
  storePromoScope: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(12),
    lineHeight: px(15),
    color: BRAND.TEXT2,
  },
  storeName: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(18),
    color: '#050505',
    lineHeight: px(22),
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(7),
    marginTop: px(-8),
  },
  ratingNum: { fontFamily: FONTS.DISPLAY, fontSize: px(16), color: '#171717' }, // reduced from 20
  reviewCount: { fontFamily: FONTS.BODY, fontSize: px(12), color: '#6B7280' }, // reduced from 14

  /* Delivery meta */
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: px(16),
    marginTop: px(14),
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: px(5),
  },
  metaValue: { fontFamily: FONTS.BODY, fontSize: px(13), color: BRAND.TEXT2 },
  freeDeliveryPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: px(5),
    backgroundColor: '#F0FFF4',
    paddingHorizontal: px(10),
    paddingVertical: px(4),
    borderRadius: px(12),
  },
  freeDeliveryText: { fontFamily: FONTS.SEMIBOLD, fontSize: px(12), color: '#2D8B5C' },
  storeStatusRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: px(12),
    marginTop: px(8), // reduced from 18
    marginBottom: px(10), // reduced from 22
  },
  closingText: {
    fontFamily: FONTS.BODY,
    fontSize: px(14),
    color: '#5F6368',
  },
  openPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: px(8),
    borderRadius: px(16),
    paddingHorizontal: px(14),
    paddingVertical: px(7),
    backgroundColor: '#EAFBEF',
  },
  closedPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: px(8),
    borderRadius: px(16),
    paddingHorizontal: px(14),
    paddingVertical: px(7),
    backgroundColor: '#FFF1F2',
  },
  statusDotOpen: {
    width: px(8),
    height: px(8),
    borderRadius: px(4),
    backgroundColor: '#17A34A',
  },
  statusDotClosed: {
    width: px(8),
    height: px(8),
    borderRadius: px(4),
    backgroundColor: '#E11D48',
  },
  openPillText: { fontFamily: FONTS.SEMIBOLD, fontSize: px(14), color: '#14833B' },
  closedPillText: { fontFamily: FONTS.SEMIBOLD, fontSize: px(14), color: '#BE123C' },
  compactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: px(6),
    marginTop: px(6),
    marginBottom: px(8),
    flexWrap: 'wrap',
    paddingHorizontal: SIDE,
  },
  compactMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(4),
  },
  compactMetaText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(12),
    color: '#4B5563',
  },
  compactMetaSeparator: {
    fontSize: px(14),
    color: '#D1D5DB',
    marginHorizontal: px(2),
  },
  productCardContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: px(8),
  },
  productDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginHorizontal: px(12),
  },
  productRow: {
    flexDirection: 'row',
    paddingVertical: px(18),
    gap: px(14),
    alignItems: 'flex-start',
  },
  rowSeparator: {
    height: 0,
  },
  productImageContainer: {
    width: px(116), // enhanced image size
    height: px(116), // enhanced image size
    borderRadius: px(16),
    backgroundColor: '#F7F7F5',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productPromoAmountBadge: {
    position: 'absolute',
    top: px(7),
    minHeight: px(24),
    borderRadius: px(12),
    paddingHorizontal: px(9),
    backgroundColor: BRAND.YELLOW,
    borderWidth: 1,
    borderColor: BRAND.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  productPromoAmountText: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(11),
    lineHeight: px(14),
    color: BRAND.TEXT,
  },
  productCardImg: {
    width: '100%',
    height: '100%',
  },
  productCardInfo: {
    flex: 1,
    gap: px(4),
  },
  productCardTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(17),
    color: '#050505',
    lineHeight: px(22),
  },
  productCardDesc: {
    fontFamily: FONTS.BODY,
    fontSize: px(11), // reduced for clean visuals and alignment
    color: '#64748B',
    lineHeight: px(15),
  },
  productCardPrice: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(17), // reduced slightly to fit side-by-side promo elements
    color: BRAND.RED, // primary brand red color
    marginTop: px(4),
  },
  originalPriceStrike: {
    fontFamily: FONTS.BODY,
    fontSize: px(12),
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginTop: px(4),
  },
  priceContainer: {
    alignItems: 'center',
  },
  productCardControl: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBtnSmall: {
    paddingHorizontal: px(10),
    paddingVertical: px(6),
    borderRadius: px(12),
    backgroundColor: '#F3F4F6',
  },
  productAddCircle: {
    width: px(32),
    height: px(32),
    borderRadius: px(16),
    backgroundColor: '#FFF8E6', // warm light gold tint background
    borderWidth: 1,
    borderColor: BRAND.YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Category chips */
  chipRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: px(20),
    marginTop: px(14),
  },
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: px(6),
  },
  chipText: { fontFamily: FONTS.BODY, fontSize: px(12), color: BRAND.TEXT3 },

  /* ── Tabs ───────────────────────────────────────────── */
  tabBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: px(48),
    paddingHorizontal: SIDE,
  },
  tab: {
    height: '100%',
    minWidth: px(88),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(14),
    color: BRAND.TEXT3,
  },
  tabLabelActive: { color: BRAND.RED },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: px(48),
    height: px(3),
    borderRadius: px(2),
    backgroundColor: BRAND.RED,
  },
  tabDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EBEBEB',
    marginHorizontal: SIDE,
  },
  tabContent: {
    marginHorizontal: SIDE,
    marginTop: px(20),
    paddingBottom: px(20),
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: px(8),
    marginBottom: px(16),
  },
  ratingBig: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(28),
    color: BRAND.TEXT,
  },
  infoTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(20),
    color: BRAND.TEXT,
    textAlign: 'right',
    marginBottom: px(10),
  },
  tabBody: {
    fontFamily: FONTS.BODY,
    fontSize: px(14),
    color: BRAND.TEXT2,
    textAlign: 'right',
    lineHeight: px(24),
  },
  tabMuted: {
    fontFamily: FONTS.BODY,
    fontSize: px(13),
    color: BRAND.TEXT3,
  },
  infoLine: {
    flexDirection: 'row-reverse',
    gap: px(8),
    alignItems: 'center',
    marginTop: px(12),
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: px(20),
    borderWidth: 1,
    borderColor: '#F1F5F9', // light gray border
    padding: px(16),
    marginTop: px(16),
  },
  infoRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(14),
    paddingVertical: px(12),
  },
  infoIconWrap: {
    width: px(38),
    height: px(38),
    borderRadius: px(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: {
    flex: 1,
    gap: px(2),
  },
  infoRowLabel: {
    fontFamily: FONTS.BODY,
    fontSize: px(11),
    color: '#8E8E93',
  },
  infoRowVal: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(13.5),
    color: '#1C1C1E',
  },
  infoRowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F1F5F9',
    marginLeft: px(52), // aligns nicely after the icon
  },
  headerTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(18),
    color: BRAND.TEXT,
  },

  /* ── Menu header ───────────────────────────────────── */
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIDE,
    marginTop: px(16),
    marginBottom: px(4),
  },
  menuTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(19),
    color: BRAND.TEXT,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(6),
    height: px(36),
    borderRadius: px(18),
    backgroundColor: '#F7F7F7',
    paddingHorizontal: px(12),
  },
  sortText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(12),
    color: BRAND.TEXT,
  },

  /* ── Menu list ─────────────────────────────────────── */
  menuList: { paddingHorizontal: px(12), paddingTop: px(4) },
  categorySection: { marginTop: px(16) },
  categoryTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(22),
    color: '#050505',
    marginTop: px(24),
    marginBottom: px(10),
  },

  /* ── Fixed category bar ────────────────────────────── */
  fixedCategoryBar: {
    zIndex: 25,
    paddingTop: px(10),
    paddingBottom: px(8),
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#EBEBEB',
  },
  categoryPillsContainer: {
    paddingHorizontal: SIDE,
    gap: px(34),
    flexDirection: 'row-reverse',
  },
  categoryPill: {
    minHeight: px(44),
    paddingHorizontal: px(8),
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: px(6),
  },
  categoryPillActive: {},
  categoryPillInactive: {},
  categoryPillText: { fontFamily: FONTS.SEMIBOLD, fontSize: px(15), color: '#111111' },
  categoryPillTextActive: { color: '#050505', fontFamily: FONTS.DISPLAY },
  categoryUnderline: {
    width: '130%',
    height: px(3),
    borderRadius: px(2),
    backgroundColor: 'transparent',
  },
  categoryUnderlineActive: { backgroundColor: BRAND.RED },

  /* ── Cart bar ──────────────────────────────────────── */
  cartBar: {
    position: 'absolute',
    left: px(10), // expanded width (less margin on sides)
    right: px(10), // expanded width (less margin on sides)
    height: px(76),
    borderRadius: px(28),
    backgroundColor: BRAND.SURFACE, // clean white surface background
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: px(10),
    gap: px(6), // slightly tighter gap to give text more space
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  bagIcon: {
    width: px(52),
    height: px(52),
    borderRadius: px(16),
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bagBadge: {
    position: 'absolute',
    top: px(-5),
    right: px(-5),
    width: px(20),
    height: px(20),
    borderRadius: px(10),
    backgroundColor: BRAND.RED,
    borderWidth: px(1.5),
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagBadgeText: { color: '#fff', fontFamily: FONTS.SEMIBOLD, fontSize: px(10), lineHeight: px(12) },
  cartInfo: { flex: 1, alignItems: 'flex-start', paddingLeft: px(4) },
  cartCount: { fontFamily: FONTS.DISPLAY, fontSize: px(12.5), color: BRAND.TEXT },
  cartSub: { fontFamily: FONTS.BODY, fontSize: px(10.5), color: '#8E8E93', marginTop: px(1) },
  cartDivider: {
    width: 1,
    height: px(28),
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: px(4),
  },
  viewCartBtn: {
    height: px(46),
    borderRadius: px(23),
    backgroundColor: BRAND.RED,
    paddingHorizontal: px(16), // reduced button padding to give text container more space
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewCartText: { color: '#fff', fontFamily: FONTS.DISPLAY, fontSize: px(12.5) },

  /* ══ Product Detail Sheet ════════════════════════════════ */
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetContainer: {
    height: SCREEN_H * 0.9,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: px(28),
    borderTopRightRadius: px(28),
    overflow: 'hidden',
  },
  sheetHandle: {
    alignItems: 'center',
    paddingTop: px(10),
    paddingBottom: px(6),
  },
  sheetHandleBar: {
    width: px(40),
    height: px(4),
    borderRadius: px(2),
    backgroundColor: '#DADADA',
  },
  sheetScroll: {
    paddingBottom: px(40),
  },
  sheetImageWrap: {
    width: '100%',
    height: SCREEN_W * 0.65,
    borderTopLeftRadius: px(28),
    borderTopRightRadius: px(28),
    overflow: 'hidden',
    position: 'relative',
    marginBottom: px(16),
  },
  sheetImage: {
    width: '100%',
    height: '100%',
  },
  sheetCloseBtn: {
    position: 'absolute',
    top: px(16),
    left: px(16),
    width: px(36),
    height: px(36),
    borderRadius: px(18),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  sheetImageActions: {
    position: 'absolute',
    top: px(16),
    right: px(16),
    flexDirection: 'row',
    gap: px(8),
  },
  sheetActionBtn: {
    width: px(36),
    height: px(36),
    borderRadius: px(18),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  sheetTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(23),
    color: '#171717',
    paddingHorizontal: px(20),
    marginBottom: px(4),
  },
  sheetStoreName: {
    fontFamily: FONTS.BODY,
    fontSize: px(13),
    color: '#6B7280',
    paddingHorizontal: px(20),
    marginBottom: px(6),
  },
  sheetRatingRow: {
    alignItems: 'center',
    gap: px(4),
    paddingHorizontal: px(20),
    marginBottom: px(10),
  },
  sheetRatingText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(14),
    color: '#171717',
  },
  sheetRatingCount: {
    fontFamily: FONTS.BODY,
    fontSize: px(13),
    color: '#6B7280',
  },
  sheetDesc: {
    fontFamily: FONTS.BODY,
    fontSize: px(14),
    color: '#5F6368',
    lineHeight: px(22),
    paddingHorizontal: px(20),
    marginBottom: px(20),
  },

  /* Option groups */
  optionGroup: {
    marginBottom: px(24),
    paddingHorizontal: px(20),
  },
  optionGroupHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: px(12),
  },
  optionGroupTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(16),
    color: '#171717',
  },
  badgeTag: {
    paddingHorizontal: px(10),
    paddingVertical: px(3),
    borderRadius: px(12),
  },
  badgeRequired: {
    backgroundColor: '#FEE2E2',
  },
  badgeOptional: {
    backgroundColor: '#F3F4F6',
  },
  badgeTagText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(11),
  },
  badgeRequiredText: {
    color: '#DC2626',
  },
  badgeOptionalText: {
    color: '#4B5563',
  },
  /* Obligatory Box Cards Wrap */
  sizeBoxRow: {
    flexWrap: 'wrap',
    gap: px(10),
  },
  sizeBoxCard: {
    width: px(112),
    height: px(76),
    borderRadius: px(16),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: px(2),
    paddingHorizontal: px(8),
  },
  sizeBoxCardUnselected: {
    backgroundColor: '#FAFAF8',
    borderColor: '#E5E7EB',
  },
  sizeBoxCardSelected: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  radioDot: {
    width: px(16),
    height: px(16),
    borderRadius: px(8),
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: px(2),
  },
  radioDotSelected: {
    borderColor: '#D97706',
    backgroundColor: '#FFFFFF',
  },
  radioDotInner: {
    width: px(8),
    height: px(8),
    borderRadius: px(4),
    backgroundColor: '#D97706',
  },
  sizeBoxTitle: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(13.5),
    color: '#374151',
  },
  sizeBoxTitleSelected: {
    fontFamily: FONTS.DISPLAY,
    color: '#92400E',
  },
  sizeBoxPrice: {
    fontFamily: FONTS.BODY,
    fontSize: px(12),
    color: '#6B7280',
  },
  sizeBoxPriceSelected: {
    fontFamily: FONTS.SEMIBOLD,
    color: '#B45309',
  },

  /* Optional Supplements Clean List Card */
  suppListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: px(14),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  suppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: px(16),
    paddingVertical: px(14),
  },
  suppRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.07)',
  },
  suppCheckbox: {
    width: px(22),
    height: px(22),
    borderRadius: px(6),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suppCheckboxChecked: {
    backgroundColor: BRAND.RED,
    borderColor: BRAND.RED,
  },
  suppLabel: {
    fontFamily: FONTS.BODY,
    fontSize: px(15),
    color: '#374151',
  },
  suppLabelChecked: {
    fontFamily: FONTS.SEMIBOLD,
    color: '#111827',
  },
  suppPrice: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(14),
    color: '#059669',
  },
  suppPriceFree: {
    fontFamily: FONTS.BODY,
    color: '#9CA3AF',
  },
  supplementLabel: {
    fontFamily: FONTS.BODY,
    fontSize: px(15),
    color: '#374151',
  },
  supplementLabelChecked: {
    fontFamily: FONTS.SEMIBOLD,
    color: '#111827',
  },
  supplementDeltaPrice: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(14),
    color: '#059669',
  },
  supplementDeltaFree: {
    fontFamily: FONTS.BODY,
    fontSize: px(13),
    color: '#6B7280',
  },
  checkboxSquare: {
    width: px(22),
    height: px(22),
    borderRadius: px(6),
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareChecked: {
    backgroundColor: BRAND.RED,
    borderColor: BRAND.RED,
  },
  checkboxBtnLabel: {
    fontFamily: FONTS.BODY,
    fontSize: px(15),
    color: '#374151',
  },
  checkboxBtnLabelChecked: {
    fontFamily: FONTS.DISPLAY,
    color: '#991B1B',
  },
  checkboxBtnPrice: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(14),
    color: '#059669',
  },
  checkboxBtnPriceFree: {
    fontFamily: FONTS.BODY,
    fontSize: px(13),
    color: '#6B7280',
  },

  /* Quantity select stepper */
  qtyRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: px(20),
    marginTop: px(12),
    marginBottom: px(20),
  },
  qtyTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(16),
    color: BRAND.TEXT,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: px(24),
    height: px(48),
    paddingHorizontal: px(6),
  },
  qtyStepperBtn: {
    width: px(36),
    height: px(36),
    borderRadius: px(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(16),
    color: '#111827',
    minWidth: px(28),
    textAlign: 'center',
  },

  /* Sheet bottom bar */
  sheetBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: px(12),
    paddingHorizontal: px(20),
    paddingTop: px(14),
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  pricePill: {
    flex: 1,
    height: px(48),
    borderRadius: px(24),
    backgroundColor: '#FAFAF8',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: px(16),
  },
  pricePillText: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(16),
    color: '#171717',
  },
  addToCartBtn: {
    flex: 1,
    height: px(48),
    borderRadius: px(24),
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: px(16),
  },
  addToCartBtnText: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(15),
    color: '#FFFFFF',
  },
  closedBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4E5',
    borderColor: '#FFE0B2',
    borderWidth: 1,
    borderRadius: px(12),
    padding: px(12),
    marginVertical: px(10),
    marginHorizontal: px(2),
  },
  closedBannerText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(12),
    color: '#8A4A00',
    textAlign: 'right',
  },
  closedBtn: {
    height: px(32),
    paddingHorizontal: px(12),
    borderRadius: px(16),
    backgroundColor: '#ECEFF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBtnText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(11),
    color: '#78909C',
  },
  closedBannerCard: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderWidth: 1,
    borderRadius: px(20),
    padding: px(16),
    marginVertical: px(12),
    width: '100%',
  },
  closedBannerIconCircle: {
    width: px(38),
    height: px(38),
    borderRadius: px(19),
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBannerCardTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(16),
    color: '#E11D48',
  },
  closedBannerCardSubtitle: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(12),
    color: '#BE123C',
    marginTop: px(1),
  },
  closedBannerCardBody: {
    fontFamily: FONTS.BODY,
    fontSize: px(12),
    color: '#4B5563',
    lineHeight: px(18),
  },
  closedBannerHoursBtn: {
    marginTop: px(14),
    height: px(38),
    borderRadius: px(12),
    borderWidth: 1,
    borderColor: '#FDA4AF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBannerHoursBtnText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: px(13),
    color: '#E11D48',
  },
  stepperCircle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(8),
    backgroundColor: '#F3F4F6',
    borderRadius: px(18),
    paddingLeft: px(10),
    paddingRight: px(4),
    height: px(36),
  },
  stepperCircleBtnMinus: {
    paddingHorizontal: px(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCircleBtnAdd: {
    width: px(28),
    height: px(28),
    borderRadius: px(14),
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(14),
    color: BRAND.TEXT,
    minWidth: px(16),
    textAlign: 'center',
  },
  rowHeartBtn: {
    position: 'absolute',
    top: px(6),
    right: px(6),
    width: px(26),
    height: px(26),
    borderRadius: px(13),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 5,
  },
  categoryNextBtn: {
    width: px(36),
    height: px(36),
    borderRadius: px(18),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginLeft: px(8),
  },
  recommSection: {
    marginTop: px(18),
    marginBottom: px(20),
  },
  recommCard: {
    backgroundColor: '#FFFDF2',
    borderRadius: px(24),
    borderWidth: 1,
    borderColor: '#FFF3C7',
    paddingHorizontal: px(16),
    paddingVertical: px(14),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recommTextWrap: {
    flex: 1,
    gap: px(2),
  },
  recommTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: px(16),
    color: '#111827',
  },
  recommSub: {
    fontFamily: FONTS.BODY,
    fontSize: px(13),
    color: '#6B7280',
  },
  recommRight: {
    alignItems: 'center',
    gap: px(12),
  },
  recommImagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommThumb: {
    width: px(36),
    height: px(36),
    borderRadius: px(18),
    borderWidth: 2,
    borderColor: '#FFFDF2',
  },
  recommArrowCircle: {
    width: px(36),
    height: px(36),
    borderRadius: px(18),
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
