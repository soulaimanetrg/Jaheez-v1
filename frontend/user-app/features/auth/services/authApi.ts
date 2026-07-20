import type { ApiResponse, User } from '@shared/types';
import { supabase } from '@/lib/supabase';
import { backendJson } from '@/lib/backendApi';

export type CustomerProfile = User & {
  phone_e164?: string | null;
  whatsapp_verified_at?: string | null;
  profile_completed_at?: string | null;
  auth_risk_level?: string;
  legal_consent_version?: string | null;
  onboarding_state: CustomerOnboardingState;
  default_address?: CustomerDefaultAddress | null;
};
export type CustomerOnboardingStep='email_confirmation'|'whatsapp_verification'|'profile'|'location'|'ready';
export type CustomerOnboardingState={authenticated:boolean;email_verified:boolean;whatsapp_verified:boolean;profile_complete:boolean;default_address_complete:boolean;next_step:CustomerOnboardingStep};
export type CustomerDefaultAddress={id:string;label:string;address:string;lat:number;lng:number;is_default:boolean;building_info?:string|null;nearby_landmark?:string|null;delivery_instructions?:string|null;location_source:'gps'|'manual_map_pin'};
export type OnboardingAddressInput={city:string;address:string;lat:number;lng:number;building_info?:string;nearby_landmark?:string;delivery_instructions?:string;location_source:'gps'|'manual_map_pin'};
export type UserProfileUpdateInput = Partial<Pick<User, 'full_name'|'avatar_url'|'city'|'language'|'notification_enabled'>>;
export function routeForCustomer(profile:CustomerProfile):string{
  switch(profile.onboarding_state?.next_step){
    case 'whatsapp_verification':return '/(auth)/profile-completion';
    case 'profile':return '/(tabs)';
    case 'location':return '/(auth)/location';
    case 'ready':return '/(tabs)';
    default:return '/(auth)/login';
  }
}

export function normalizeMoroccanPhone(input: string): string {
  const digits = String(input || '').replace(/\D/g, '');
  const local = digits.startsWith('212') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  if (!/^[67]\d{8}$/.test(local)) throw new Error('Entrez un numero marocain valide commencant par 06 ou 07.');
  return `+212${local}`;
}

export async function bootstrapCurrentCustomer(input: Record<string, unknown> = {}): Promise<CustomerProfile> {
  return backendJson<CustomerProfile>('/admin-api/auth/customer/bootstrap', { method: 'POST', body: JSON.stringify(input) });
}

export async function registerWithPhonePassword(input:{fullName:string;phone:string;password:string;language:'ar'|'fr'|'en'}):Promise<ApiResponse<{phone:string;profile:CustomerProfile;requiresOtp:false}>>{
  try {
    const passwordError=validateCustomerPassword(input.password);if(passwordError)throw new Error(passwordError);
    const normalized=normalizeMoroccanPhone(input.phone);
    const result=await backendJson<{session:{access_token:string;refresh_token:string}}>('/admin-api/auth/register',{method:'POST',body:JSON.stringify({phone:normalized,password:input.password,full_name:input.fullName.trim(),language:input.language,legal_consent_version:'2026-01'})});
    const {error}=await supabase.auth.setSession(result.session);if(error)throw error;
    return { data: { phone: normalized,profile:await bootstrapCurrentCustomer(),requiresOtp:false }, error: null };
  }catch(error:unknown){return {data:null,error:authMessage(error)}}
}

export async function registerWithEmailPassword(input:{fullName:string;email:string;password:string;language:'ar'|'fr'|'en'}):Promise<ApiResponse<{email:string;profile:CustomerProfile}>>{
  try{
    const passwordError=validateCustomerPassword(input.password);if(passwordError)throw new Error(passwordError);
    const email=input.email.trim().toLowerCase();
    const result=await backendJson<{session:{access_token:string;refresh_token:string}}>('/admin-api/auth/register',{method:'POST',body:JSON.stringify({email,password:input.password,full_name:input.fullName.trim(),language:input.language,legal_consent_version:'2026-01'})});
    const{error}=await supabase.auth.setSession(result.session);if(error)throw error;
    return{data:{email,profile:await bootstrapCurrentCustomer()},error:null};
  }catch(error:unknown){return{data:null,error:authMessage(error)}}
}

const COMMON_PASSWORDS=new Set(['password123','1234567890','qwerty1234','azerty1234','motdepasse','jaheez1234']);
export function validateCustomerPassword(password:string):string|null{
  if(password.length<10)return 'Le mot de passe doit contenir au moins 10 caracteres.';
  if(COMMON_PASSWORDS.has(password.toLowerCase()))return 'Choisissez un mot de passe moins courant.';
  if(!/[A-Za-z]/.test(password)||!/[0-9]/.test(password))return 'Ajoutez au moins une lettre et un chiffre.';
  return null;
}

export async function signInWithPhonePassword(phone:string,password:string):Promise<ApiResponse<CustomerProfile>>{
  try {
    const normalized=normalizeMoroccanPhone(phone);
    const result=await backendJson<{session:{access_token:string;refresh_token:string}}>('/admin-api/auth/login',{method:'POST',body:JSON.stringify({phone:normalized,password})});
    const {error}=await supabase.auth.setSession(result.session);if(error)throw error;
    return {data:await bootstrapCurrentCustomer(),error:null};
  }catch(error:unknown){return {data:null,error:authMessage(error)}}
}

export async function signInWithEmailPassword(email:string,password:string):Promise<ApiResponse<CustomerProfile>>{
  try{
    const result=await backendJson<{session:{access_token:string;refresh_token:string}}>('/admin-api/auth/login',{method:'POST',body:JSON.stringify({email:email.trim().toLowerCase(),password})});
    const{error}=await supabase.auth.setSession(result.session);if(error)throw error;
    return{data:await bootstrapCurrentCustomer(),error:null};
  }catch(error:unknown){return{data:null,error:authMessage(error)}}
}

export async function saveOnboardingAddress(input:OnboardingAddressInput):Promise<ApiResponse<CustomerProfile>>{
  try{return {data:await backendJson<CustomerProfile>('/admin-api/v1/customer/onboarding/address',{method:'POST',body:JSON.stringify(input)}),error:null}}catch(error:unknown){return {data:null,error:authMessage(error)}}
}

export async function updateUserProfile(_userId:string, updates:UserProfileUpdateInput):Promise<ApiResponse<CustomerProfile>>{
  try{return {data:await backendJson<CustomerProfile>('/admin-api/v1/customer/profile',{method:'PATCH',body:JSON.stringify(updates)}),error:null}}catch(error:unknown){return {data:null,error:authMessage(error)}}
}
export async function getCurrentUser():Promise<ApiResponse<CustomerProfile>>{
  try{const {data:{session}}=await supabase.auth.getSession();if(!session)return {data:null,error:null};return {data:await bootstrapCurrentCustomer(),error:null}}catch(error:unknown){return {data:null,error:authMessage(error)}}
}
export async function logoutUser():Promise<ApiResponse<null>>{
  try{const {error}=await supabase.auth.signOut({scope:'global'});if(error)throw error;return {data:null,error:null}}catch(error:unknown){return {data:null,error:authMessage(error)}}
}

function authMessage(error:unknown):string{
  const raw=error instanceof Error?error.message:String(error||'Authentication failed');const value=raw.toLowerCase();
  if(value.includes('already')||value.includes('registered')||value.includes('exists'))return 'Creation impossible. Connectez-vous ou utilisez Mot de passe oublie.';
  if(value.includes('allowlist')||value.includes('not enabled'))return 'Ce numero de test n est pas encore active.';
  if(value.includes('provider')||value.includes('hook')||value.includes('delivery')||value.includes('whatsapp'))return 'La verification WhatsApp est temporairement indisponible. Continuez par email ou reessayez plus tard.';
  if(value.includes('rate')||value.includes('too many'))return 'Trop de tentatives. Reessayez plus tard.';
  if(value.includes('expired'))return 'Le code a expire. Demandez un nouveau code.';
  if(value.includes('invalid')||value.includes('token'))return 'Le code est incorrect.';
  if(value.includes('network')||value.includes('fetch'))return 'Connexion impossible. Verifiez votre internet.';
  if(value.includes('credential')||value.includes('password'))return 'Identifiants invalides ou compte non confirme.';
  return raw;
}
