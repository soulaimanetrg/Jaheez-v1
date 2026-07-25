import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ImageSourcePropType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { AppIcon } from '@/components/ui/AppIcon';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { BRAND, FONTS } from '../../constants/brand';

interface StoreListCardProps {
  id: string;
  name: string;
  imageUrl: string | null;
  deliveryFee: number | null;
  feeLabel: string | null;
  etaMin: number | null;
  etaMax: number | null;
  isOpen: boolean;
  isNew: boolean;
  isFavorite: boolean;
  lang: string;
  isRTL: boolean;
  index: number;
  placeholder: ImageSourcePropType;
  promoType?: 'store_percentage' | 'store_fixed' | 'articles' | 'none';
  reductionPercentage?: number;
  onPress: () => void;
  onToggleFavorite: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const StoreListCard: React.FC<StoreListCardProps> = React.memo(({
  name,
  imageUrl,
  deliveryFee,
  feeLabel,
  etaMin,
  etaMax,
  isOpen,
  isFavorite,
  lang,
  isRTL,
  index,
  placeholder,
  onPress,
  onToggleFavorite,
  promoType,
  reductionPercentage,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(index * 40, withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) }));
    translateY.value = withDelay(index * 40, withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) }));
  }, [index, opacity, translateY]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const isArabic = lang === 'ar';
  const isFrench = lang === 'fr';
  const hasEta = typeof etaMin === 'number' && etaMin > 0 && typeof etaMax === 'number' && etaMax > 0;
  const etaText = hasEta ? (isArabic ? `${etaMin}-${etaMax} \u062f\u0642\u064a\u0642\u0629` : `${etaMin}-${etaMax} min`) : null;
  const closedLabel = isArabic ? '\u0645\u063a\u0644\u0642' : isFrench ? 'Ferme' : 'Closed';

  const flexDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  const deliveryFeeText = useMemo(() => {
    if (deliveryFee === null || feeLabel === null) return null;
    if (deliveryFee <= 0) return isArabic ? '\u062a\u0648\u0635\u064a\u0644 \u0645\u062c\u0627\u0646\u064a' : isFrench ? 'Livraison gratuite' : 'Free delivery';
    return isArabic ? `${feeLabel} \u0631\u0633\u0648\u0645 \u0627\u0644\u062a\u0648\u0635\u064a\u0644` : isFrench ? `Livraison ${feeLabel}` : `Delivery ${feeLabel}`;
  }, [deliveryFee, feeLabel, isArabic, isFrench]);

  const promoLabel = useMemo(() => {
    if (!promoType || promoType === 'none') return null;
    const amount = Number(reductionPercentage || 0);
    const amountLabel = promoType === 'store_fixed'
      ? `${amount} DH`
      : amount > 0
        ? `${amount}%`
        : (lang === 'en' ? 'Offer' : 'Promo');

    if (promoType === 'store_percentage') {
      return {
        amount: amountLabel,
        scope: lang === 'en' ? 'on the whole store' : 'sur toute la boutique',
      };
    }
    if (promoType === 'store_fixed') {
      return {
        amount: amountLabel,
        scope: lang === 'en' ? 'on the whole store' : 'sur toute la boutique',
      };
    }
    return {
      amount: amountLabel,
      scope: lang === 'en' ? 'on selected products' : 'sur certains produits',
    };
  }, [lang, promoType, reductionPercentage]);

  return (
    <AnimatedPressable
      style={[styles.card, containerAnimatedStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.985, { duration: 120, easing: Easing.out(Easing.ease) });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.ease) });
      }}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      <View style={styles.imageWrap}>
        <Image
          source={imageUrl ? { uri: imageUrl } : placeholder}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={name}
        />

        {!isOpen ? <View pointerEvents="none" style={styles.closedVeil} /> : null}

        <FavoriteButton
          isFavorite={isFavorite}
          onToggle={onToggleFavorite}
          size={21}
          style={styles.favoriteBtn}
        />

        {!isOpen ? (
          <View style={[styles.closedPill, { flexDirection: flexDir }]}>
            <AppIcon name="moon" size={12} color={BRAND.SURFACE} />
            <Text style={styles.closedText}>{closedLabel}</Text>
          </View>
        ) : null}

        {promoLabel ? (
          <View style={styles.promoBadge}>
            <Text style={styles.promoAmount}>{promoLabel.amount}</Text>
            <Text style={styles.promoScope}>{promoLabel.scope}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.details}>
        <Text style={[styles.storeName, { textAlign }]} numberOfLines={1}>
          {name}
        </Text>
        {deliveryFeeText ? (
          <Text style={[styles.deliveryFee, { textAlign }]} numberOfLines={1}>
            {deliveryFeeText}
          </Text>
        ) : null}
        {etaText ? (
          <View style={[styles.metaRow, { flexDirection: flexDir }]}>
            <Text style={styles.metaText}>{etaText}</Text>
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: BRAND.SURFACE,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageWrap: {
    height: 180,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: BRAND.LIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closedVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND.TEXT,
    opacity: 0.42,
    zIndex: 2,
  },
  favoriteBtn: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BRAND.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  closedPill: {
    position: 'absolute',
    left: 12,
    top: 12,
    backgroundColor: BRAND.TEXT,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    gap: 4,
    zIndex: 3,
  },
  closedText: {
    color: BRAND.SURFACE,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12,
  },
  promoBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    maxWidth: '74%',
    backgroundColor: BRAND.YELLOW,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 3,
  },
  promoAmount: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 18,
    fontWeight: '800',
    color: BRAND.TEXT,
  },
  promoScope: {
    marginTop: 1,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 11,
    color: BRAND.TEXT,
  },
  details: {
    paddingTop: 10,
    paddingBottom: 8,
    gap: 4,
  },
  storeName: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.TEXT,
  },
  deliveryFee: {
    fontFamily: FONTS.BODY,
    fontSize: 14,
    color: BRAND.TEXT2,
  },
  metaRow: {
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.TEXT2,
  },
});
