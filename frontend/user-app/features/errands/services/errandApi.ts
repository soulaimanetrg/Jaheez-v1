import { backendJson } from '@/lib/backendApi';

export type ErrandServiceType='send_item'|'pickup_existing_order';
export type ErrandItemCategory='documents'|'keys'|'clothes'|'food_package'|'small_parcel'|'other';
export type ErrandItemSize='small'|'medium'|'large';
export type ErrandWeightBand='under_2kg'|'2_to_5kg'|'5_to_9kg';

export interface SavedAddress { id:string;label:string;address:string;lat:number|null;lng:number|null;is_default?:boolean; }
export interface ErrandDraftInput {
  service_type:ErrandServiceType;
  pickup_address:string;pickup_lat:number;pickup_lng:number;
  dropoff_address:string;dropoff_lat:number;dropoff_lng:number;
  pickup_contact_name:string;pickup_contact_phone:string;
  recipient_name:string;recipient_phone:string;
  item_category:ErrandItemCategory;item_size:ErrandItemSize;weight_band:ErrandWeightBand;
  declared_value_dh:number;existing_order_code?:string|null;existing_order_paid?:boolean|null;
  instructions?:string|null;scheduled_for?:string|null;safety_confirmed:true;
}
export interface ErrandQuote {id:string;version:number;distance_km:number;delivery_fee_dh:number;service_fee_dh:number;total_dh:number;requires_manual_price:boolean;expires_at:string;}

export const listErrandAddresses=()=>backendJson<SavedAddress[]>('/admin-api/v1/customer/addresses');
export const getErrandAvailability=()=>backendJson<{enabled:boolean;buy_enabled:false;service_types:ErrandServiceType[]}>('/admin-api/v1/customer/errands/availability');
export const createErrandDraft=(input:ErrandDraftInput,idempotencyKey:string)=>backendJson<{id:string;status:string;replayed:boolean}>('/admin-api/v1/customer/errands/drafts',{method:'POST',headers:{'Idempotency-Key':idempotencyKey},body:JSON.stringify(input)});
export const quoteErrand=(draftId:string)=>backendJson<ErrandQuote>(`/admin-api/v1/customer/errands/${encodeURIComponent(draftId)}/quote`,{method:'POST',body:'{}'});
export const getErrandQuote=(draftId:string,quoteId:string)=>backendJson<ErrandQuote>(`/admin-api/v1/customer/errands/${encodeURIComponent(draftId)}/quotes/${encodeURIComponent(quoteId)}`);
export const submitErrand=(draftId:string,quoteId:string)=>backendJson<{order_id:string;status:string;moderation_status:string;message:string}>(`/admin-api/v1/customer/errands/${encodeURIComponent(draftId)}/submit`,{method:'POST',body:JSON.stringify({quote_id:quoteId})});
