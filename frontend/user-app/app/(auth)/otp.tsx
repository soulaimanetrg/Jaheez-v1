import { Redirect } from 'expo-router';

export default function FrozenOtpScreen() {
  return <Redirect href="/(auth)/login" />;
}
