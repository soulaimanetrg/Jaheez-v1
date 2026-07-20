import { supabase } from '../../db/supabase';

export class ErrandRepository {
  async getSettings(keys: string[]) {
    const { data, error } = await supabase.from('app_settings').select('key,value').in('key', keys);
    if (error) throw new Error(error.message);
    return Object.fromEntries((data || []).map((row) => [row.key, row.value])) as Record<string,string>;
  }

  async getCustomer(userId: string) {
    const { data, error } = await supabase.from('users').select('id,phone,is_banned').eq('id', userId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async findDraftByIdempotency(userId: string, key: string) {
    const { data, error } = await supabase.from('errand_drafts').select('id,status,request_hash').eq('user_id',userId).eq('idempotency_key',key).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async createDraft(input: Record<string,unknown>) {
    const { data, error } = await supabase.from('errand_drafts').insert(input).select('id,status,service_type,created_at').single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getOwnedDraft(userId: string, draftId: string) {
    const { data, error } = await supabase.from('errand_drafts').select('*').eq('id',draftId).eq('user_id',userId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateOwnedDraft(userId: string, draftId: string, updates: Record<string,unknown>) {
    const { data, error } = await supabase.from('errand_drafts').update({ ...updates, updated_at:new Date().toISOString() }).eq('id',draftId).eq('user_id',userId).eq('status','draft').select('id,status,service_type,updated_at').maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async getNextQuoteVersion(draftId: string) {
    const { data, error } = await supabase.from('errand_quotes').select('version').eq('draft_id',draftId).order('version',{ascending:false}).limit(1);
    if (error) throw new Error(error.message);
    return Number(data?.[0]?.version || 0) + 1;
  }

  async createQuote(input: Record<string,unknown>) {
    await supabase.from('errand_quotes').update({status:'replaced'}).eq('draft_id',input.draft_id).eq('status','active');
    const { data, error } = await supabase.from('errand_quotes').insert(input).select('*').single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getOwnedQuote(userId:string,draftId:string,quoteId:string){
    const {data,error}=await supabase.from('errand_quotes').select('id,version,distance_km,delivery_fee_centimes,service_fee_centimes,total_centimes,status,requires_manual_price,expires_at').eq('id',quoteId).eq('draft_id',draftId).eq('user_id',userId).maybeSingle();
    if(error) throw new Error(error.message);
    return data;
  }

  async listManualQuotes(){
    const {data,error}=await supabase.from('errand_quotes').select('id,version,distance_km,expires_at,created_at,errand_drafts(id,user_id,service_type,pickup_address,dropoff_address,risk_flags)').eq('status','active').eq('requires_manual_price',true).order('created_at',{ascending:false}).limit(100);
    if(error) throw new Error(error.message);
    return data||[];
  }

  async adjustManualQuote(quoteId:string,totalCentimes:number,reason:string,actorId:string){
    const {data,error}=await supabase.rpc('adjust_guided_errand_quote',{p_quote_id:quoteId,p_total_centimes:totalCentimes,p_reason:reason,p_actor_id:actorId});
    if(error) throw new Error(error.message);
    return data;
  }

  async submit(userId: string, draftId: string, quoteId: string) {
    const { data, error } = await supabase.rpc('submit_guided_errand',{ p_user_id:userId,p_draft_id:draftId,p_quote_id:quoteId });
    if (error) throw new Error(error.message);
    return String(data);
  }

  async searchStores(name: string) {
    const normalized = name.normalize('NFKC').replace(/[^\p{L}\p{N}\s-]/gu,' ').replace(/\s+/g,' ').trim();
    if (normalized.length < 2) return [];
    const fields = 'id,name,name_ar,category,logo_url,lat,lng,is_active';
    const [latin, arabic] = await Promise.all([
      supabase.from('stores').select(fields).eq('is_active',true).ilike('name',`%${normalized}%`).limit(5),
      supabase.from('stores').select(fields).eq('is_active',true).ilike('name_ar',`%${normalized}%`).limit(5),
    ]);
    if (latin.error) throw new Error(latin.error.message);
    if (arabic.error) throw new Error(arabic.error.message);
    return [...new Map([...(latin.data || []),...(arabic.data || [])].map((row:any)=>[row.id,row])).values()].slice(0,5);
  }

  async getErrandForDriver(orderId:string,driverId:string) {
    const { data,error }=await supabase.from('orders').select('id,driver_id,order_type,status,errand_details(errand_stage)').eq('id',orderId).eq('driver_id',driverId).eq('order_type','errand').maybeSingle();
    if(error) throw new Error(error.message);
    return data;
  }

  async listForAdmin() {
    const { data, error } = await supabase.from('orders').select('id,user_id,status,moderation_status,driver_id,total_amount,created_at,errand_details(*,errand_quotes(version,pricing_version,expires_at,requires_manual_price,distance_km)),errand_proofs(id,proof_type,storage_path,mime_type,size_bytes,created_at),errand_events(event_type,actor_type,created_at,metadata)').eq('order_type','errand').order('created_at',{ascending:false}).limit(200);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getErrandForAdmin(orderId: string) {
    const { data, error } = await supabase.from('orders').select('id,user_id,status,moderation_status,driver_id,errand_details(*)').eq('id',orderId).eq('order_type','errand').maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateAdminReview(orderId: string, updates: Record<string,unknown>) {
    const { error } = await supabase.from('orders').update({ ...updates,updated_at:new Date().toISOString() }).eq('id',orderId).eq('order_type','errand');
    if (error) throw new Error(error.message);
  }

  async updateStage(orderId: string, stage: string) {
    const { error } = await supabase.from('errand_details').update({errand_stage:stage,updated_at:new Date().toISOString()}).eq('order_id',orderId);
    if (error) throw new Error(error.message);
  }

  async addEvent(input: Record<string,unknown>) {
    const { error } = await supabase.from('errand_events').insert(input);
    if (error) throw new Error(error.message);
  }

  async findProofByIdempotency(driverId:string,key:string) {
    const {data,error}=await supabase.from('errand_proofs').select('id,proof_type,created_at').eq('actor_id',driverId).eq('idempotency_key',key).maybeSingle();
    if(error) throw new Error(error.message);
    return data;
  }

  async uploadProofFile(path:string,bytes:Buffer,mimeType:string) {
    const {error}=await supabase.storage.from('errand-proofs').upload(path,bytes,{contentType:mimeType,upsert:false});
    if(error) throw new Error(error.message);
  }

  async removeProofFile(path:string) {
    await supabase.storage.from('errand-proofs').remove([path]);
  }

  async createProof(input:Record<string,unknown>) {
    const {data,error}=await supabase.from('errand_proofs').insert(input).select('id,proof_type,created_at').single();
    if(error) throw new Error(error.message);
    return data;
  }

  async signProof(path:string) {
    const {data,error}=await supabase.storage.from('errand-proofs').createSignedUrl(path,300);
    if(error) throw new Error(error.message);
    return data.signedUrl;
  }

  async openDispute(input:Record<string,unknown>){
    const {data,error}=await supabase.from('support_requests').insert(input).select('id,ref_number,status,created_at').single();
    if(error) throw new Error(error.message);
    return data;
  }

  async notifyUser(userId:string,title:string,body:string){
    const {error}=await supabase.from('notifications_log').insert({title,body,target:userId,sent_by:'errand_operations'});
    if(error) throw new Error(error.message);
  }
}
