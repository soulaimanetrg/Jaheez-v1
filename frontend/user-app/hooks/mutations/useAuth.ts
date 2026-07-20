import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logoutUser, updateUserProfile } from '../../lib/authApi';
import type { UserProfileUpdateInput } from '../../lib/authApi';
import { useAuthStore } from '../../store/authStore';

export function useLogout(){
  const logout=useAuthStore(s=>s.logout),queryClient=useQueryClient();
  return useMutation({mutationFn:async()=>{const result=await logoutUser();if(result.error)throw new Error(result.error)},onSuccess:()=>{logout();queryClient.clear()}});
}
export function useUpdateProfile(){
  const user=useAuthStore(s=>s.user),setUser=useAuthStore(s=>s.setUser);
  return useMutation({mutationFn:async(updates:UserProfileUpdateInput)=>{if(!user?.id)throw new Error('Connexion requise');const result=await updateUserProfile(user.id,updates);if(result.error||!result.data)throw new Error(result.error||'Mise a jour impossible');return result.data},onSuccess:setUser});
}
