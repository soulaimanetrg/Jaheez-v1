import React from 'react';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Platform, Image, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { AppIcon } from '@/components/ui/AppIcon';
import { BRAND, FONTS, JUI, ANIM } from '../../constants/brand';
import { useLangStore } from '../../store/languageStore';
import { useCartStore } from '../../store/cartStore';
import { dirRow } from '../../lib/direction';
import { useAuthStore } from '../../store/authStore';
import { routeForCustomer } from '../../features/auth/services/authApi';

type TabName = 'index' | 'cart' | 'search' | 'profile';

const TAB_ICONS: Record<TabName, { icon: string; iconActive: string }> = {
  index:   { icon: 'home-outline',   iconActive: 'home'   },
  cart:    { icon: 'cart-outline',   iconActive: 'cart'   },
  search:  { icon: 'search-outline', iconActive: 'search' },
  profile: { icon: 'person-outline', iconActive: 'person' },
};

/* ── Modern & Elegant Animated Tab Item ─── */
function TabItem({ route, focused, label, navigation }: {
  route: any;
  focused: boolean;
  label: string;
  navigation: any;
}) {
  const icons = TAB_ICONS[route.name as TabName];
  if (!icons) return null;

  const cartCount = useCartStore(s => (route.name === 'cart' ? s.getItemCount() : 0));

  const focusAnim = useSharedValue(focused ? 1 : 0);
  const pressScale = useSharedValue(1);

  React.useEffect(() => {
    focusAnim.value = withSpring(focused ? 1 : 0, {
      damping: 15,
      stiffness: 180,
      mass: 0.7,
    });
  }, [focused, focusAnim]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pressScale.value }],
    };
  });

  const pillAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(focusAnim.value, [0, 1], [0, 1]);
    return {
      opacity,
    };
  });

  const labelAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(focusAnim.value, [0, 1], [0.8, 1]);
    return {
      opacity,
    };
  });

  const handlePress = () => {
    if (Platform.OS !== 'web') Vibration.vibrate(1);

    pressScale.value = withSequence(
      withTiming(0.92, { duration: 60, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 100, easing: Easing.out(Easing.ease) }),
    );

    const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
  };

  return (
    <Pressable
      key={route.key}
      style={styles.tabItem}
      onPress={handlePress}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.tabIconWrap, containerAnimatedStyle]}>
        {/* Modern Soft Pill Indicator Backdrop */}
        <Animated.View style={[styles.activePill, pillAnimatedStyle]} />

        <AppIcon
          name={focused ? icons.iconActive : icons.icon}
          size={JUI.ICON_MD}
          color={focused ? BRAND.RED : BRAND.TEXT3}
          active={focused}
        />

        {/* Tab badge for cart items */}
        {route.name === 'cart' && cartCount > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
          </View>
        )}
      </Animated.View>

      <Animated.Text style={[styles.tabLabel, focused && styles.tabLabelActive, labelAnimatedStyle]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

/* ── FAB with pulse when cart has items ─── */
function FabButton() {
  const router = useRouter();
  const { t } = useLangStore();
  const cartCount = useCartStore(s => s.getItemCount());
  const pulseScale = useSharedValue(1);
  const pressScale = useSharedValue(1);

  React.useEffect(() => {
    if (cartCount > 0) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      pulseScale.value = withSpring(1, ANIM.SPRING);
    }
  }, [cartCount, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value * pressScale.value }],
  }));

  const handlePress = () => {
    if (Platform.OS !== 'web') Vibration.vibrate(1);
    pressScale.value = withSequence(
      withTiming(0.88, { duration: 70 }),
      withSpring(1, { damping: 10, stiffness: 220 }),
    );
    router.push('/(flows)/custom-request');
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        pressed && { opacity: 0.92 },
      ]}
      onPress={handlePress}
      accessibilityLabel={t.newOrder}
    >
      <Animated.View style={[styles.fabCircle, pulseStyle]}>
        <Image
          source={require('../../assets/icons/middle.png')}
          style={styles.fabIcon}
          resizeMode="contain"
        />
        {cartCount > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
          </View>
        )}
      </Animated.View>
      <Text style={styles.fabLabel}>{t.newOrder}</Text>
    </Pressable>
  );
}

/* ── Custom Tab Bar ─── */
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLangStore();

  const TAB_LABELS: Record<TabName, string> = {
    index:   t.home,
    cart:    t.cart,
    search:  t.search,
    profile: t.account,
  };

  const visible = state.routes.filter(
    (r: any) => r.name !== 'chat' && r.name !== 'wallet' && r.name !== 'orders',
  );
  const byName = (name: TabName) => visible.find((r: any) => r.name === name);
  const ordered = [
    byName('index'),
    byName('search'),
    byName('cart'),
    byName('profile'),
  ].filter(Boolean);
  const left  = isRTL ? ordered.slice(2, 4) : ordered.slice(0, 2);
  const right = isRTL ? ordered.slice(0, 2) : ordered.slice(2, 4);

  const renderTab = (route: any) => {
    const label = TAB_LABELS[route.name as TabName] ?? route.name;
    const realIdx = state.routes.findIndex((r: any) => r.key === route.key);
    const focused = state.index === realIdx;
    return (
      <TabItem
        key={route.key}
        route={route}
        focused={focused}
        label={label}
        navigation={navigation}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10 }]}>
      <View style={[styles.bar, { flexDirection: dirRow(isRTL) }]}>
        <View style={[styles.tabGroup, { flexDirection: dirRow(isRTL) }]}>{left.map(renderTab)}</View>
        <View style={styles.spacer} />
        <View style={[styles.tabGroup, { flexDirection: dirRow(isRTL) }]}>{right.map(renderTab)}</View>
      </View>
      <FabButton />
    </View>
  );
}

export default function TabLayout() {
  const user=useAuthStore(s=>s.user),loading=useAuthStore(s=>s.isLoading);
  if(loading)return null;
  if(!user)return <Redirect href="/(auth)/login"/>;
  const target=routeForCustomer(user);
  if(target!=='/(tabs)')return <Redirect href={target as any}/>;
  return (
    <Tabs tabBar={props => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="cart" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="wallet" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
    paddingTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -3px 14px rgba(0,0,0,0.04)',
      } as any,
    }),
  },
  bar: {
    alignItems: 'center',
    width: '100%',
    height: 56,
    paddingHorizontal: 10,
  },
  tabGroup: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  spacer: { width: 72 },

  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  tabIconWrap: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(240, 48, 48, 0.08)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(240, 48, 48, 0.14)',
  },
  tabBadge: {
    position: 'absolute',
    top: -1,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tabBadgeText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 8.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabLabel: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 10.5,
    color: BRAND.TEXT3,
  },
  tabLabelActive: {
    color: BRAND.RED,
  },

  fab: {
    position: 'absolute',
    top: -22,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  fabCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: BRAND.RED,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 14px rgba(240,48,48,0.35)',
      } as any,
    }),
  },
  fabIcon: { width: 28, height: 28 },
  fabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BRAND.YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 3,
  },
  fabBadgeText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 9,
    color: BRAND.TEXT,
    fontWeight: '700',
  },
  fabLabel: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 10,
    color: BRAND.RED,
    marginTop: 3,
  },
});
