import { AppIcon } from '@/components/ui/AppIcon';
import { Tabs } from 'expo-router';
import { Home, User } from 'lucide-react-native';
import { BRAND, FONTS } from '../../constants/brand';
import { useLangStore } from '../../lib/i18n';

export default function TabsLayout() {
  const t = useLangStore(s => s.t);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND.RED,
        tabBarInactiveTintColor: BRAND.TEXT3,
        tabBarStyle: { backgroundColor: BRAND.SURFACE, borderTopColor: BRAND.BORDER, paddingTop: 6, paddingBottom: 8, height: 64 },
        tabBarLabelStyle: { fontFamily: FONTS.SEMIBOLD, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.dashboard, tabBarIcon: ({ color, focused }) => <AppIcon icon={Home} size={22} color={color} active={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: t.profile, tabBarIcon: ({ color, focused }) => <AppIcon icon={User} size={22} color={color} active={focused} /> }} />
    </Tabs>
  );
}
