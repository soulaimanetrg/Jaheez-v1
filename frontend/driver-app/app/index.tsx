import { Redirect } from 'expo-router';
import { useDriverStore } from '../store/driverStore';
export default function Index() {
  const driver = useDriverStore(s => s.driver);
  return <Redirect href={driver ? (driver.must_change_password ? '/(flows)/change-password' : '/(tabs)') : '/(auth)/welcome'} />;
}
