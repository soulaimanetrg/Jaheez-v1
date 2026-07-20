import { useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getCurrentUser, logoutUser, updateUserProfile, type UserProfileUpdateInput } from '../lib/authApi';

export function useAuth(){
  const store=useAuthStore();
  const [error,setError]=useState<string|null>(null);
  const refreshUser=useCallback(async()=>{const result=await getCurrentUser();if(result.error){setError(result.error);return false}store.setUser(result.data);return Boolean(result.data)},[store]);
  const logout=useCallback(async()=>{await logoutUser();store.logout()},[store]);
  const updateProfile=useCallback(async(updates:UserProfileUpdateInput)=>{if(!store.user)return false;const result=await updateUserProfile(store.user.id,updates);if(result.error||!result.data){setError(result.error);return false}store.setUser(result.data);return true},[store]);
  return {user:store.user,isLoading:store.isLoading,isAuthenticated:store.isAuthenticated,error,clearError:()=>setError(null),refreshUser,logout,updateProfile};
}
