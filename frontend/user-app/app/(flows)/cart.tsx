import { Redirect } from 'expo-router';

export default function LegacyCartRedirect() {
  return <Redirect href="/(tabs)/cart" />;
}
