import { Redirect } from 'expo-router';

export default function FrozenResetPasswordScreen() {
  return <Redirect href="/(auth)/login" />;
}
