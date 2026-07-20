import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Platform, Image, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Ionicons';
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

/* ── Animated Tab Item ─── */
function TabItem({ route, focused, label, navigation }: {
  route: any;
  focused: boolean;
  label: string;
  navigation: any;
}) {
  const icons = TAB_ICONS[route.name as TabName];
  if (!icons) return null;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // Haptic feedback
    if (Platform.OS !== 'web') Vibration.vibrate(1);
    // Bounce animation
    scale.value = withSequence(
      withTiming(0.88, { duration: 80, easing: Easing.out(Easing.ease) }),
      withSpring(1, ANIM.SPRING),
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
      <Animated.View style={[styles.tabIconWrap, animatedStyle]}>
        <Ionicons
          name={(focused ? icons.iconActive : icons.icon) as any}
          size={JUI.ICON_MD}
          color={focused ? BRAND.RED : BRAND.TEXT3}
        />
      </Animated.View>
      {/* Active dot indicator */}
      {focused && <View style={styles.activeDot} />}
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ── FAB with pulse when cart has items ─── */
function FabButton() {
  const router = useRouter();
  const { t } = useLangStore();
  const cartCount = useCartStore(s => s.getItemCount());
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (cartCount > 0) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      pulseScale.value = withSpring(1, ANIM.SPRING);
    }
  }, [cartCount, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handlePress = () => {
    if (Platform.OS !== 'web') Vibration.vibrate(1);
    router.push('/(flows)/custom-request');
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        pressed && { opacity: 0.9 },
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
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  tabIconWrap: {
    width: 32,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: BRAND.RED,
    marginTop: 1,
  },
  tabLabel: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 10,
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
