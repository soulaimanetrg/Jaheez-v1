import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../middleware/error.middleware';
import { OrderLifecycleService } from '../order/orderLifecycle.service';
import { ErrandRepository } from './errand.repository';
import { CustomerTrustService } from '../auth/customerTrust.service';
import { createHash,randomUUID } from 'crypto';

type DraftInput = {
  service_type: 'send_item'|'pickup_existing_order';
  pickup_address: string; pickup_lat: number; pickup_lng: number;
  dropoff_address: string; dropoff_lat: number; dropoff_lng: number;
  pickup_contact_name: string; pickup_contact_phone: string;
  recipient_name: string; recipient_phone: string;
  item_category: string; item_size: string; weight_band: string;
  declared_value_dh: number; existing_order_code?: string|null; existing_order_paid?: boolean|null;
  instructions?: string|null; scheduled_for?: string|null; safety_confirmed: true;
};

type PricingZone = { max_km:number; fee_centimes:number };

export class ErrandService {
  private customerTrust = new CustomerTrustService();
  private repo = new ErrandRepository();
  private lifecycle = new OrderLifecycleService();

  private async settings() {
    return this.repo.getSettings(['feature_guided_errands_enabled','feature_errand_buy_enabled','errand_pricing_version','errand_quote_ttl_seconds','errand_pricing_zones_json']);
  }

  async availability(){
    const settings=await this.settings();
    return {enabled:settings.feature_guided_errands_enabled==='true',buy_enabled:false,service_types:['send_item','pickup_existing_order']};
  }

  private normalizePhone(value: string) {
    const phone = value.replace(/[\s().-]/g,'');
    if (!/^\+?[0-9]{8,15}$/.test(phone)) throw new BadRequestError('Numero de telephone invalide','invalid_phone');
    return phone;
  }

  private assessRisk(input:Partial<DraftInput>) {
    const text=String(input.instructions||'').normalize('NFKC').toLocaleLowerCase();
    const prohibited=[/\b(weapon|gun|knife|drug|cocaine|cannabis|alcohol|cigarette|tobacco|explosive)\b/i,/\b(arme|drogue|cocaïne|cannabis|alcool|cigarette|tabac|explosif)\b/i,/(سلاح|مخدرات|كوكايين|حشيش|كحول|سجائر|متفجرات)/];
    if(prohibited.some((pattern)=>pattern.test(text))) throw new BadRequestError('Cette demande contient un article interdit.','prohibited_errand_request');
    const flags:string[]=[];
    if(input.item_category==='other') flags.push('OTHER_CATEGORY');
    if(Number(input.declared_value_dh||0)>=400) flags.push('HIGH_DECLARED_VALUE');
    if(input.weight_band==='5_to_9kg') flags.push('HEAVY_PACKAGE');
    if(input.scheduled_for) flags.push('SCHEDULED_REQUEST');
    return flags;
  }

  private draftRow(userId:string,input:Partial<DraftInput>) {
    const row:Record<string,unknown>={...input};
    if (input.declared_value_dh !== undefined) {
      row.declared_value_centimes=Math.round(input.declared_value_dh*100);
      delete row.declared_value_dh;
    }
    if (input.pickup_contact_phone) row.pickup_contact_phone=this.normalizePhone(input.pickup_contact_phone);
    if (input.recipient_phone) row.recipient_phone=this.normalizePhone(input.recipient_phone);
    row.user_id=userId;
    return row;
  }

  async createDraft(userId:string,input:DraftInput,idempotencyKey:string) {
    const settings=await this.settings();
    if (settings.feature_guided_errands_enabled!=='true') throw new ConflictError('Service de courses non active','errands_disabled');
    const customer=await this.repo.getCustomer(userId);
    if (!customer || customer.is_banned) throw new ForbiddenError('Compte non autorise','customer_not_eligible');
    if (!customer.phone) throw new ForbiddenError('Telephone verifie requis','verified_phone_required');
    const requestHash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const existing=await this.repo.findDraftByIdempotency(userId,idempotencyKey);
    if (existing) {
      if(existing.request_hash!==requestHash) throw new ConflictError('Cle idempotente reutilisee avec une autre demande','idempotency_payload_mismatch');
      return {...existing,request_hash:undefined,replayed:true};
    }
    try {
      const data=await this.repo.createDraft({...this.draftRow(userId,input),risk_flags:this.assessRisk(input),idempotency_key:idempotencyKey,request_hash:requestHash});
      return {...data,replayed:false};
    } catch(error:unknown) {
      const raced=await this.repo.findDraftByIdempotency(userId,idempotencyKey);
      if(!raced) throw error;
      if(raced.request_hash!==requestHash) throw new ConflictError('Cle idempotente reutilisee avec une autre demande','idempotency_payload_mismatch');
      return {...raced,request_hash:undefined,replayed:true};
    }
  }

  async updateDraft(userId:string,draftId:string,input:Partial<DraftInput>) {
    const feature=await this.settings();
    if(feature.feature_guided_errands_enabled!=='true') throw new ConflictError('Service de courses non active','errands_disabled');
    const draft=await this.repo.getOwnedDraft(userId,draftId);
    if (!draft) throw new NotFoundError('Brouillon introuvable','errand_draft_not_found');
    if (draft.status!=='draft') throw new ConflictError('Brouillon verrouille','errand_draft_locked');
    const merged={...draft,...input,declared_value_dh:input.declared_value_dh??Number(draft.declared_value_centimes||0)/100};
    const data=await this.repo.updateOwnedDraft(userId,draftId,{...this.draftRow(userId,input),risk_flags:this.assessRisk(merged)});
    if (!data) throw new ConflictError('Brouillon non modifiable','errand_draft_locked');
    return data;
  }

  private distanceKm(aLat:number,aLng:number,bLat:number,bLng:number) {
    const rad=(n:number)=>n*Math.PI/180;
    const dLat=rad(bLat-aLat),dLng=rad(bLng-aLng);
    const h=Math.sin(dLat/2)**2+Math.cos(rad(aLat))*Math.cos(rad(bLat))*Math.sin(dLng/2)**2;
    return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
  }

  async quote(userId:string,draftId:string) {
    const [draft,settings]=await Promise.all([this.repo.getOwnedDraft(userId,draftId),this.settings()]);
    if(settings.feature_guided_errands_enabled!=='true') throw new ConflictError('Service de courses non active','errands_disabled');
    if (!draft) throw new NotFoundError('Brouillon introuvable','errand_draft_not_found');
    if (draft.status!=='draft') throw new ConflictError('Brouillon verrouille','errand_draft_locked');
    let zones:PricingZone[];
    try { zones=JSON.parse(settings.errand_pricing_zones_json||'[]'); } catch { zones=[]; }
    if (!Array.isArray(zones)||!zones.length) throw new ConflictError('Tarification indisponible','errand_pricing_unavailable');
    zones=zones.filter(z=>Number.isFinite(z.max_km)&&Number.isInteger(z.fee_centimes)&&z.max_km>0&&z.fee_centimes>=0).sort((a,b)=>a.max_km-b.max_km);
    if (!zones.length) throw new ConflictError('Tarification indisponible','errand_pricing_unavailable');
    const distance=this.distanceKm(Number(draft.pickup_lat),Number(draft.pickup_lng),Number(draft.dropoff_lat),Number(draft.dropoff_lng));
    const zone=zones.find(z=>distance<=z.max_km);
    const ttl=Math.min(Math.max(Number(settings.errand_quote_ttl_seconds)||900,60),3600);
    const version=await this.repo.getNextQuoteVersion(draftId);
    const total=zone?.fee_centimes||0;
    const quote=await this.repo.createQuote({draft_id:draftId,user_id:userId,version,distance_km:Number(distance.toFixed(3)),delivery_fee_centimes:total,service_fee_centimes:0,total_centimes:total,status:'active',pricing_version:settings.errand_pricing_version||'zones-v1',requires_manual_price:!zone,expires_at:new Date(Date.now()+ttl*1000).toISOString()});
    return {id:quote.id,version:quote.version,distance_km:Number(quote.distance_km),delivery_fee_dh:Number(quote.delivery_fee_centimes)/100,service_fee_dh:Number(quote.service_fee_centimes)/100,total_dh:Number(quote.total_centimes)/100,requires_manual_price:Boolean(quote.requires_manual_price),expires_at:quote.expires_at};
  }

  private quoteDto(quote:any){return {id:quote.id,version:quote.version,distance_km:Number(quote.distance_km),delivery_fee_dh:Number(quote.delivery_fee_centimes)/100,service_fee_dh:Number(quote.service_fee_centimes)/100,total_dh:Number(quote.total_centimes)/100,requires_manual_price:Boolean(quote.requires_manual_price),expires_at:quote.expires_at};}

  async getQuote(userId:string,draftId:string,quoteId:string){
    const quote=await this.repo.getOwnedQuote(userId,draftId,quoteId);
    if(!quote)throw new NotFoundError('Devis introuvable','errand_quote_not_found');
    return this.quoteDto(quote);
  }

  async listManualQuotes(){
    const rows=await this.repo.listManualQuotes();
    return rows.map((row:any)=>{const draft=Array.isArray(row.errand_drafts)?row.errand_drafts[0]:row.errand_drafts;return {id:row.id,version:row.version,distance_km:Number(row.distance_km),expires_at:row.expires_at,created_at:row.created_at,draft:draft?{id:draft.id,user_id:draft.user_id,service_type:draft.service_type,pickup_address:draft.pickup_address,dropoff_address:draft.dropoff_address,risk_flags:Array.isArray(draft.risk_flags)?draft.risk_flags:[]}:null};});
  }

  async adjustManualQuote(quoteId:string,totalDh:number,reason:string,actorId:string){
    const adjusted=await this.repo.adjustManualQuote(quoteId,Math.round(totalDh*100),reason,actorId);
    return {id:adjusted.id,version:adjusted.version,total_dh:Number(adjusted.total_centimes)/100,expires_at:adjusted.expires_at};
  }

  async submit(userId:string,draftId:string,quoteId:string) {
    await this.customerTrust.requireOrderReady(userId);
    const settings=await this.settings();
    if(settings.feature_guided_errands_enabled!=='true') throw new ConflictError('Service de courses non active','errands_disabled');
    try {
      const orderId=await this.repo.submit(userId,draftId,quoteId);
      return {order_id:orderId,status:'pending',moderation_status:'pending_review',message:'operations_review'};
    } catch(error:unknown) {
      const message=error instanceof Error?error.message:'';
      if (message.includes('not_found')) throw new NotFoundError('Brouillon ou devis introuvable','errand_not_found');
      if (message.includes('conflict')) throw new ConflictError('Devis expire ou demande non soumissible','errand_not_submittable');
      throw error;
    }
  }

  async detectStoreConflict(input:{mode:'buy'|'pickup_existing_order';store_name:string}) {
    const stores=await this.repo.searchStores(input.store_name);
    const match=stores[0];
    if (!match) return {match_found:false,recommended_action:'continue'};
    return {match_found:true,confidence:'name_match',store:{id:match.id,name:match.name,name_ar:match.name_ar,logo_url:match.logo_url,category:match.category},recommended_action:input.mode==='pickup_existing_order'?'continue_pickup':'open_store'};
  }

  async listAdmin() {
    const rows=await this.repo.listForAdmin();
    return Promise.all(rows.map(async(row:any)=>{
      const details=Array.isArray(row.errand_details)?row.errand_details[0]:row.errand_details;
      const proofs=await Promise.all((row.errand_proofs||[]).map(async(proof:any)=>({id:proof.id,proof_type:proof.proof_type,mime_type:proof.mime_type,size_bytes:proof.size_bytes,created_at:proof.created_at,url:await this.repo.signProof(proof.storage_path).catch(()=>null)})));
      const quote=Array.isArray(details?.errand_quotes)?details.errand_quotes[0]:details?.errand_quotes;
      return {id:row.id,user_id:row.user_id,status:row.status,moderation_status:row.moderation_status,driver_id:row.driver_id,total_dh:Number(row.total_amount||0),created_at:row.created_at,proofs,events:(row.errand_events||[]).map((event:any)=>({event_type:event.event_type,actor_type:event.actor_type,created_at:event.created_at,metadata:event.metadata})),details:details?{service_type:details.service_type,errand_stage:details.errand_stage,pickup_address:details.pickup_address,pickup_contact_name:details.pickup_contact_name,pickup_contact_phone:details.pickup_contact_phone,recipient_name:details.recipient_name,recipient_phone:details.recipient_phone,item_category:details.item_category,item_size:details.item_size,weight_band:details.weight_band,declared_value_dh:Number(details.declared_value_centimes||0)/100,existing_order_code:details.existing_order_code,existing_order_paid:details.existing_order_paid,instructions:details.instructions,scheduled_for:details.scheduled_for,risk_flags:Array.isArray(details.risk_flags)?details.risk_flags:[],quote:quote?{version:quote.version,pricing_version:quote.pricing_version,expires_at:quote.expires_at,requires_manual_price:quote.requires_manual_price,distance_km:Number(quote.distance_km)}:null}:null};
    }));
  }

  async reviewAdmin(orderId:string,input:{action:'approve'|'reject'|'request_information';reason:string},actor:{id:string;email?:string}) {
    const order=await this.repo.getErrandForAdmin(orderId);
    if (!order) throw new NotFoundError('Course introuvable','errand_not_found');
    const retryingApproval=input.action==='approve'&&order.moderation_status==='approved'&&order.status==='pending';
    if (order.moderation_status!=='pending_review'&&!retryingApproval) throw new ConflictError('Course deja traitee','errand_already_reviewed');
    if (input.action==='approve') {
      if (!retryingApproval) {
        await this.repo.updateAdminReview(orderId,{moderation_status:'approved'});
        await this.repo.updateStage(orderId,'approved');
      }
      await this.lifecycle.transitionOrder(orderId,{type:'admin',id:actor.id,email:actor.email},'confirmed',`Errand approved: ${input.reason}`);
    } else if (input.action==='reject') {
      await this.repo.updateAdminReview(orderId,{moderation_status:'rejected'});
      await this.repo.updateStage(orderId,'rejected');
      await this.lifecycle.transitionOrder(orderId,{type:'admin',id:actor.id,email:actor.email},'cancelled',`Errand rejected: ${input.reason}`);
    } else {
      await this.repo.updateStage(orderId,'needs_information');
      await this.repo.notifyUser(order.user_id,'Informations requises',`Votre course #${orderId.slice(0,8)} necessite une precision. Ouvrez le support Jaheez pour repondre.`);
    }
    await this.repo.addEvent({order_id:orderId,event_type:`review_${input.action}`,actor_type:'admin',actor_id:actor.id,metadata:{reason:input.reason}});
    return {ok:true,action:input.action};
  }

  async syncDriverStage(orderId:string,driverId:string,stage:'arrived_pickup'|'picked_up'|'arrived_customer'|'delivered') {
    const order=await this.repo.getErrandForDriver(orderId,driverId);
    if(!order) return;
    const mapped={arrived_pickup:'arrived_pickup',picked_up:'picked_up',arrived_customer:'arrived_dropoff',delivered:'delivered'} as const;
    await this.repo.updateStage(orderId,mapped[stage]);
    await this.repo.addEvent({order_id:orderId,event_type:`driver_${stage}`,actor_type:'driver',actor_id:driverId,metadata:{}});
  }

  async syncAdminAssignment(orderId:string,driverId:string|null,actorId:string) {
    const order=await this.repo.getErrandForAdmin(orderId);
    if(!order) return;
    await this.repo.updateStage(orderId,driverId?'assigned':'approved');
    await this.repo.addEvent({order_id:orderId,event_type:driverId?'courier_assigned':'courier_unassigned',actor_type:'admin',actor_id:actorId,metadata:{driver_id:driverId}});
  }

  async uploadDriverProof(orderId:string,driverId:string,input:{proof_type:'pickup'|'delivery';mime_type:'image/jpeg'|'image/png'|'image/webp';file_base64:string},idempotencyKey:string) {
    const existing=await this.repo.findProofByIdempotency(driverId,idempotencyKey);
    if(existing) return {...existing,replayed:true};
    const order=await this.repo.getErrandForDriver(orderId,driverId);
    if(!order) throw new NotFoundError('Course introuvable','errand_not_found');
    const allowed=input.proof_type==='pickup'?['confirmed','preparing']:['picked_up'];
    if(!allowed.includes(order.status)) throw new ConflictError('Preuve non autorisee a cette etape','errand_proof_wrong_stage');
    const bytes=Buffer.from(input.file_base64,'base64');
    if(bytes.length<16||bytes.length>5*1024*1024) throw new BadRequestError('Taille de fichier invalide','invalid_proof_size');
    const signatures:Record<string,(b:Buffer)=>boolean>={
      'image/jpeg':b=>b[0]===0xff&&b[1]===0xd8&&b[b.length-2]===0xff&&b[b.length-1]===0xd9,
      'image/png':b=>b.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])),
      'image/webp':b=>b.subarray(0,4).toString('ascii')==='RIFF'&&b.subarray(8,12).toString('ascii')==='WEBP',
    };
    if(!signatures[input.mime_type]?.(bytes)) throw new BadRequestError('Contenu image invalide','invalid_proof_content');
    const extension={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[input.mime_type];
    const path=`${orderId}/${input.proof_type}-${randomUUID()}.${extension}`;
    await this.repo.uploadProofFile(path,bytes,input.mime_type);
    try {
      const proof=await this.repo.createProof({order_id:orderId,proof_type:input.proof_type,storage_path:path,mime_type:input.mime_type,size_bytes:bytes.length,actor_type:'driver',actor_id:driverId,idempotency_key:idempotencyKey});
      await this.repo.addEvent({order_id:orderId,event_type:`${input.proof_type}_proof_uploaded`,actor_type:'driver',actor_id:driverId,metadata:{proof_id:proof.id}});
      return {...proof,replayed:false};
    } catch(error) {
      await this.repo.removeProofFile(path);
      const raced=await this.repo.findProofByIdempotency(driverId,idempotencyKey);
      if(raced) return {...raced,replayed:true};
      throw error;
    }
  }

  async syncCustomerCancellation(orderId:string,userId:string,reason:string) {
    await this.repo.updateStage(orderId,'cancelled');
    await this.repo.addEvent({order_id:orderId,event_type:'cancelled_by_customer',actor_type:'customer',actor_id:userId,metadata:{reason}});
  }

  async syncAdminCancellation(orderId:string,actorId:string,reason:string) {
    await this.repo.updateStage(orderId,'cancelled');
    await this.repo.addEvent({order_id:orderId,event_type:'cancelled_by_admin',actor_type:'admin',actor_id:actorId,metadata:{reason}});
  }

  async openAdminDispute(orderId:string,reason:string,actorId:string){
    const order=await this.repo.getErrandForAdmin(orderId);
    if(!order) throw new NotFoundError('Course introuvable','errand_not_found');
    const dispute=await this.repo.openDispute({user_id:order.user_id,order_id:orderId,category:'errand_dispute',urgency:'high',subject:'Errand dispute opened by operations',message:reason,ref_number:`ERR-${Date.now().toString().slice(-8)}`,status:'open'});
    await this.repo.addEvent({order_id:orderId,event_type:'dispute_opened',actor_type:'admin',actor_id:actorId,metadata:{support_request_id:dispute.id,reason}});
    return dispute;
  }
}
