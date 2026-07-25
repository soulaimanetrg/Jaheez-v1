import { Redirect } from 'expo-router';

export default function RemovedWelcomeScreen() {
  return <Redirect href="/(auth)/login" />;
}
