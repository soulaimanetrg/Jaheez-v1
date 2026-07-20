import { Redirect } from 'expo-router';

export default function FrozenPasswordRecoveryScreen() {
  return <Redirect href="/(auth)/login" />;
}
