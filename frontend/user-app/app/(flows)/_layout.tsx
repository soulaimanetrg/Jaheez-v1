import { Redirect,Stack } from 'expo-router';
import { routeForCustomer } from '@/features/auth/services/authApi';
import { useAuthStore } from '@/store/authStore';
export default function ProtectedFlows(){const user=useAuthStore(s=>s.user),loading=useAuthStore(s=>s.isLoading);if(loading)return null;if(!user)return <Redirect href="/(auth)/login"/>;const target=routeForCustomer(user);if(target!=='/(tabs)')return <Redirect href={target as any}/>;return <Stack screenOptions={{headerShown:false}}/>}
