import { NextFunction,Request,Response } from 'express';
import { BadRequestError } from '../../middleware/error.middleware';
import { ErrandService } from './errand.service';

export class ErrandController {
  private service=new ErrandService();
  private user(req:Request){const id=req.supabaseUser?.id;if(!id)throw new BadRequestError('Utilisateur non identifie','user_not_identified');return id;}
  private key(req:Request){const key=String(req.headers['idempotency-key']||'').trim();if(!/^[A-Za-z0-9:_-]{16,128}$/.test(key))throw new BadRequestError('Idempotency-Key invalide','invalid_idempotency_key');return key;}
  private driver(req:Request){const id=req.driver?.driver_id;if(!id)throw new BadRequestError('Livreur non identifie','driver_not_identified');return id;}
  availability=async(_req:Request,res:Response,next:NextFunction)=>{try{res.json(await this.service.availability());}catch(e){next(e);}};
  createDraft=async(req:Request,res:Response,next:NextFunction)=>{try{res.status(201).json(await this.service.createDraft(this.user(req),req.body,this.key(req)));}catch(e){next(e);}};
  updateDraft=async(req:Request,res:Response,next:NextFunction)=>{try{res.json(await this.service.updateDraft(this.user(req),req.params.id,req.body));}catch(e){next(e);}};
  quote=async(req:Request,res:Response,next:NextFunction)=>{try{res.json(await this.service.quote(this.user(req),req.params.id));}catch(e){next(e);}};
  getQuote=async(req:Request,res:Response,next:NextFunction)=>{try{res.json(await this.service.getQuote(this.user(req),req.params.id,req.params.quoteId));}catch(e){next(e);}};
  submit=async(req:Request,res:Response,next:NextFunction)=>{try{res.status(201).json(await this.service.submit(this.user(req),req.params.id,req.body.quote_id));}catch(e){next(e);}};
  storeConflict=async(req:Request,res:Response,next:NextFunction)=>{try{res.json(await this.service.detectStoreConflict(req.body));}catch(e){next(e);}};
  listAdmin=async(_req:Request,res:Response,next:NextFunction)=>{try{res.json(await this.service.listAdmin());}catch(e){next(e);}};
  reviewAdmin=async(req:Request,res:Response,next:NextFunction)=>{try{res.json(await this.service.reviewAdmin(req.params.id,req.body,{id:req.admin?.id||'admin',email:req.admin?.email}));}catch(e){next(e);}};
  uploadDriverProof=async(req:Request,res:Response,next:NextFunction)=>{try{res.status(201).json(await this.service.uploadDriverProof(req.params.id,this.driver(req),req.body,this.key(req)));}catch(e){next(e);}};
  openAdminDispute=async(req:Request,res:Response,next:NextFunction)=>{try{res.status(201).json(await this.service.openAdminDispute(req.params.id,req.body.reason,req.admin?.id||'admin'));}catch(e){next(e);}};
  listManualQuotes=async(_req:Request,res:Response,next:NextFunction)=>{try{res.json(await this.service.listManualQuotes());}catch(e){next(e);}};
  adjustManualQuote=async(req:Request,res:Response,next:NextFunction)=>{try{res.json(await this.service.adjustManualQuote(req.params.quoteId,req.body.total_dh,req.body.reason,req.admin?.id||'admin'));}catch(e){next(e);}};
}
