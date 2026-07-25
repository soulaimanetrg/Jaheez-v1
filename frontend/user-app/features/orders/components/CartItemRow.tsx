import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn, FadeOut,
  useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { AppIcon } from '@/components/ui/AppIcon';
import { HapticTab } from '@/components/ui/HapticTab';
import { ASSETS } from '@/constants/assets';
import { BRAND, FONTS } from '@/constants/brand';
import type { CartLine } from '../store/cartStore';
import { formatCartMoney, parseCartBilingual, type CartLanguage } from '../cartFormatters';
import { cartCopy } from '../cartCopy';

type Props = {
  item: CartLine;
  unitPrice?: number;
  lang: CartLanguage;
  isRTL: boolean;
  onDetails: (item: CartLine) => void;
  onEdit: (item: CartLine) => void;
  onRemove: (cartLineId: string) => void;
  onUpdateQuantity: (cartLineId: string, quantity: number) => void;
};

function localizedName(item: CartLine, lang: CartLanguage): string {
  const candidate = lang === 'ar' ? item.name_ar || item.name : item.name || item.name_ar;
  return parseCartBilingual(candidate, lang);
}

function CartItemRowComponent({
  item,
  unitPrice,
  lang,
  isRTL,
  onDetails,
  onEdit,
  onRemove,
  onUpdateQuantity,
}: Props) {
  const reduceMotion = useReducedMotion();
  const quantityScale = useSharedValue(1);
  const copy = cartCopy(lang);

  useEffect(() => {
    if (reduceMotion) return;
    quantityScale.value = withSequence(
      withTiming(1.18, { duration: 80 }),
      withTiming(1, { duration: 110 }),
    );
  }, [item.quantity, quantityScale, reduceMotion]);

  const qtyAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: quantityScale.value }],
  }));

  const optionSummary = (item.selected_options || [])
    .map((opt) => parseCartBilingual(opt.choice_name, lang))
    .filter(Boolean)
    .map((opt) => `• ${opt}`)
    .join(' ');

  const name = localizedName(item, lang);
  const displayPrice = unitPrice !== undefined ? unitPrice * item.quantity : item.unit_price * item.quantity;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(160)}
      exiting={reduceMotion ? undefined : FadeOut.duration(120)}
      style={styles.card}
    >
      {/* ── TOP SECTION ──────────────────────────── */}
      <View style={[styles.topRow, isRTL && styles.rowReverse]}>
        {/* ── ITEM IMAGE (Overflow hidden, 72x72) ── */}
        <Pressable
          onPress={() => onDetails(item)}
          accessibilityRole="button"
          accessibilityLabel={name}
          style={styles.imageContainer}
        >
          <Image
            source={item.image_url ? { uri: item.image_url } : ASSETS.illustrations.jaheez_grocery_large}
            style={styles.image}
            contentFit="cover"
            accessibilityLabel={name}
          />
        </Pressable>

        {/* ── INFO: Name, Options, Price ─────────── */}
        <Pressable
          onPress={() => onDetails(item)}
          accessibilityRole="button"
          accessibilityLabel={name}
          style={[styles.infoCol, isRTL && styles.alignEnd]}
        >
          <Text
            style={[styles.name, isRTL && styles.textRight]}
            numberOfLines={1}
          >
            {name}
          </Text>

          {optionSummary ? (
            <Text
              style={[styles.options, isRTL && styles.textRight]}
              numberOfLines={1}
            >
              {optionSummary}
            </Text>
          ) : null}

          <Text style={[styles.price, isRTL && styles.textRight]}>
            {formatCartMoney(displayPrice)}
          </Text>
        </Pressable>

        {/* ── STEPPER CONTROLS (44x44 min tap targets) ── */}
        <View style={[styles.stepper, isRTL && styles.rowReverse]}>
          <HapticTab
            scaleDown={0.88}
            haptic={false}
            style={styles.stepBtnMinus}
            hitSlop={6}
            disabled={item.quantity <= 1}
            onPress={() => onUpdateQuantity(item.cart_line_id, item.quantity - 1)}
            accessibilityRole="button"
            accessibilityLabel={`${name} - ${copy.decreaseQtyHint}`}
            accessibilityHint={copy.decreaseQtyHint}
          >
            <AppIcon
              name="remove"
              size={16}
              color={item.quantity > 1 ? BRAND.TEXT : BRAND.TEXT3}
            />
          </HapticTab>

          <Animated.Text style={[styles.qtyText, qtyAnimStyle]}>
            {item.quantity}
          </Animated.Text>

          <HapticTab
            scaleDown={0.88}
            haptic={false}
            style={styles.stepBtnPlus}
            hitSlop={6}
            disabled={item.quantity >= 50}
            onPress={() => onUpdateQuantity(item.cart_line_id, item.quantity + 1)}
            accessibilityRole="button"
            accessibilityLabel={`${name} - ${copy.increaseQtyHint}`}
            accessibilityHint={copy.increaseQtyHint}
          >
            <AppIcon
              name="add"
              size={16}
              color={BRAND.SURFACE}
            />
          </HapticTab>
        </View>
      </View>

      {/* ── SEPARATOR LINE ──────────────────────── */}
      <View style={styles.divider} />

      {/* ── BOTTOM ACTIONS (Remove & Edit) ── */}
      <View style={[styles.actionsRow, isRTL && styles.rowReverse]}>
        {/* Remove Button: Red Icon + Red Text */}
        <Pressable
          onPress={() => onRemove(item.cart_line_id)}
          accessibilityRole="button"
          accessibilityLabel={`${copy.remove} ${name}`}
          accessibilityHint={copy.removeItemHint}
          style={({ pressed }) => [
            styles.actionBtnHalf,
            isRTL && styles.rowReverse,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon name="trash-outline" size={15} color={BRAND.RED} />
          <Text style={styles.removeActionText}>{copy.remove}</Text>
        </Pressable>

        <View style={styles.verticalDivider} />

        {/* Edit Button: Dark Neutral Icon + Dark Neutral Text */}
        <Pressable
          onPress={() => onEdit(item)}
          accessibilityRole="button"
          accessibilityLabel={`${copy.edit} ${name}`}
          accessibilityHint={copy.editItemHint}
          style={({ pressed }) => [
            styles.actionBtnHalf,
            isRTL && styles.rowReverse,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon name="create-outline" size={15} color={BRAND.TEXT} />
          <Text style={styles.editActionText}>{copy.edit}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export const CartItemRow = React.memo(CartItemRowComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: BRAND.SURFACE,
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  rowReverse: { flexDirection: 'row-reverse' },
  alignEnd: { alignItems: 'flex-end' },
  textRight: { textAlign: 'right' },
  pressed: { opacity: 0.7 },

  /* Image container with overflow hidden */
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: BRAND.LIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },

  /* Info column */
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 12,
    gap: 3,
  },
  name: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 14,
    color: BRAND.TEXT,
  },
  options: {
    fontFamily: FONTS.BODY,
    fontSize: 11.5,
    color: BRAND.TEXT3,
  },
  price: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.TEXT,
    marginTop: 2,
  },

  /* Stepper controls (minimum 44x44 tap targets) */
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtnMinus: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  stepBtnPlus: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.RED,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  qtyText: {
    minWidth: 28,
    textAlign: 'center',
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.TEXT,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: BRAND.BORDER,
  },

  /* Actions Row */
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  actionBtnHalf: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  verticalDivider: {
    width: 1,
    height: 20,
    backgroundColor: BRAND.BORDER,
  },
  removeActionText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 12.5,
    color: BRAND.RED,
  },
  editActionText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 12.5,
    color: BRAND.TEXT,
  },
});
