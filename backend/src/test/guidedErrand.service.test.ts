import { describe, expect, it, vi } from 'vitest';
import { ErrandService } from '../features/errand/errand.service';
import { errandDraftSchema, errandDraftUpdateSchema, errandProofSchema } from '../features/errand/errand.validators';
import { createHash } from 'crypto';

const input = {
  service_type: 'send_item' as const,
  pickup_address: 'Hay Salam, Safi', pickup_lat: 32.3000, pickup_lng: -9.2300,
  dropoff_address: 'Centre Ville, Safi', dropoff_lat: 32.3180, dropoff_lng: -9.2300,
  pickup_contact_name: 'Sender Name', pickup_contact_phone: '+212600000001',
  recipient_name: 'Recipient Name', recipient_phone: '+212600000002',
  item_category: 'documents' as const, item_size: 'small' as const, weight_band: 'under_2kg' as const,
  declared_value_dh: 100, instructions: 'Sealed envelope', safety_confirmed: true as const,
};

const settings = {
  feature_guided_errands_enabled: 'true', feature_errand_buy_enabled: 'false',
  errand_pricing_version: 'zones-v1', errand_quote_ttl_seconds: '900',
  errand_pricing_zones_json: JSON.stringify([
    { max_km: 2, fee_centimes: 1500 }, { max_km: 4, fee_centimes: 2200 },
    { max_km: 6, fee_centimes: 3000 }, { max_km: 8, fee_centimes: 4000 },
  ]),
};

function makeService(overrides: Record<string, unknown> = {}) {
  const service = new ErrandService();
  const repo = {
    getSettings: vi.fn().mockResolvedValue(settings), getCustomer: vi.fn().mockResolvedValue({ id: 'user-1', phone: '+212600000001', is_banned: false }),
    findDraftByIdempotency: vi.fn().mockResolvedValue(null), createDraft: vi.fn().mockResolvedValue({ id: 'draft-1', status: 'draft', service_type: 'send_item' }),
    getOwnedDraft: vi.fn().mockResolvedValue({ id: 'draft-1', user_id: 'user-1', status: 'draft', ...input, declared_value_centimes: 10000 }),
    updateOwnedDraft: vi.fn().mockResolvedValue({ id: 'draft-1', status: 'draft' }), getNextQuoteVersion: vi.fn().mockResolvedValue(1),
    createQuote: vi.fn().mockImplementation(async (quote) => ({ id: 'quote-1', ...quote })), submit: vi.fn().mockResolvedValue('order-1'),
    searchStores: vi.fn().mockResolvedValue([]), listForAdmin: vi.fn().mockResolvedValue([]), getErrandForAdmin: vi.fn(),
    updateAdminReview: vi.fn(), updateStage: vi.fn(), addEvent: vi.fn(), getErrandForDriver: vi.fn(),
    findProofByIdempotency:vi.fn().mockResolvedValue(null),uploadProofFile:vi.fn(),removeProofFile:vi.fn(),createProof:vi.fn().mockResolvedValue({id:'proof-1',proof_type:'pickup',created_at:'2026-01-01'}),
    ...overrides,
  };
  (service as any).repo = repo;
  return { service, repo };
}

describe('guided errand security and pricing', () => {
  it('strictly rejects server-owned and unknown fields', () => {
    expect(errandDraftSchema.safeParse({ ...input, user_id: 'attacker' }).success).toBe(false);
    expect(errandDraftSchema.safeParse({ ...input, service_type: 'buy_from_another_place' }).success).toBe(false);
    expect(errandDraftSchema.safeParse({ ...input, declared_value_dh: 501 }).success).toBe(false);
    expect(errandDraftUpdateSchema.safeParse({ total_centimes: 1 }).success).toBe(false);
    expect(errandProofSchema.safeParse({ proof_type:'pickup',mime_type:'image/jpeg',file_base64:'AAAA',storage_path:'attacker' }).success).toBe(false);
  });

  it('requires an order code for existing-order pickup', () => {
    expect(errandDraftSchema.safeParse({ ...input, service_type: 'pickup_existing_order' }).success).toBe(false);
    expect(errandDraftSchema.safeParse({ ...input, service_type: 'pickup_existing_order', existing_order_code: 'PICKUP-42' }).success).toBe(true);
  });

  it('creates a backend-only zone quote and exposes DH fields only', async () => {
    const { service, repo } = makeService();
    const quote = await service.quote('user-1', 'draft-1');
    expect(repo.createQuote).toHaveBeenCalledWith(expect.objectContaining({ delivery_fee_centimes: 2200, total_centimes: 2200, requires_manual_price: false }));
    expect(quote).toMatchObject({ delivery_fee_dh: 22, total_dh: 22, version: 1 });
    expect(quote).not.toHaveProperty('total_centimes');
  });

  it('requires manual pricing above eight kilometres', async () => {
    const { service, repo } = makeService({
      getOwnedDraft: vi.fn().mockResolvedValue({ id: 'draft-1', user_id: 'user-1', status: 'draft', ...input, dropoff_lat: 32.40 }),
    });
    const quote = await service.quote('user-1', 'draft-1');
    expect(repo.createQuote).toHaveBeenCalledWith(expect.objectContaining({ total_centimes: 0, requires_manual_price: true }));
    expect(quote.requires_manual_price).toBe(true);
  });

  it('fails closed on object-level authorization', async () => {
    const { service, repo } = makeService({ getOwnedDraft: vi.fn().mockResolvedValue(null) });
    await expect(service.updateDraft('wrong-user', 'draft-1', { instructions: 'changed' })).rejects.toMatchObject({ errorCode: 'errand_draft_not_found' });
    expect(repo.updateOwnedDraft).not.toHaveBeenCalled();
  });

  it('does not enable the service when its backend flag is off', async () => {
    const { service, repo } = makeService({ getSettings: vi.fn().mockResolvedValue({ ...settings, feature_guided_errands_enabled: 'false' }) });
    await expect(service.createDraft('user-1', input, 'errand:1234567890123456')).rejects.toMatchObject({ errorCode: 'errands_disabled' });
    expect(repo.createDraft).not.toHaveBeenCalled();
  });

  it('reports disabled availability unless the backend setting is explicitly true',async()=>{
    const {service}=makeService({getSettings:vi.fn().mockResolvedValue({...settings,feature_guided_errands_enabled:'false'})});
    await expect(service.availability()).resolves.toMatchObject({enabled:false,buy_enabled:false,service_types:['send_item','pickup_existing_order']});
  });

  it('rejects an idempotency key reused with a different payload',async()=>{
    const requestHash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const {service,repo}=makeService({findDraftByIdempotency:vi.fn().mockResolvedValue({id:'draft-1',status:'draft',request_hash:requestHash})});
    await expect(service.createDraft('user-1',{...input,recipient_name:'Different Recipient'},'errand:1234567890123456')).rejects.toMatchObject({errorCode:'idempotency_payload_mismatch'});
    expect(repo.createDraft).not.toHaveBeenCalled();
  });

  it('rejects prohibited request text before persistence', async()=>{
    const {service,repo}=makeService();
    await expect(service.createDraft('user-1',{...input,instructions:'Please deliver a weapon'},'errand:1234567890123456')).rejects.toMatchObject({errorCode:'prohibited_errand_request'});
    expect(repo.createDraft).not.toHaveBeenCalled();
  });

  it('rejects proof upload for another driver or wrong lifecycle stage',async()=>{
    const tinyJpeg=Buffer.from([0xff,0xd8,...new Array(20).fill(1),0xff,0xd9]).toString('base64');
    const {service,repo}=makeService({getErrandForDriver:vi.fn().mockResolvedValue(null)});
    await expect(service.uploadDriverProof('order-1','wrong-driver',{proof_type:'pickup',mime_type:'image/jpeg',file_base64:tinyJpeg},'proof:1234567890123456')).rejects.toMatchObject({errorCode:'errand_not_found'});
    expect(repo.uploadProofFile).not.toHaveBeenCalled();
  });

  it('validates image bytes and records immutable proof metadata',async()=>{
    const jpeg=Buffer.from([0xff,0xd8,...new Array(20).fill(1),0xff,0xd9]).toString('base64');
    const {service,repo}=makeService({getErrandForDriver:vi.fn().mockResolvedValue({id:'order-1',status:'confirmed',driver_id:'driver-1',order_type:'errand'})});
    const result=await service.uploadDriverProof('order-1','driver-1',{proof_type:'pickup',mime_type:'image/jpeg',file_base64:jpeg},'proof:1234567890123456');
    expect(repo.uploadProofFile).toHaveBeenCalledWith(expect.stringMatching(/^order-1\/pickup-/),expect.any(Buffer),'image/jpeg');
    expect(repo.createProof).toHaveBeenCalledWith(expect.objectContaining({order_id:'order-1',actor_id:'driver-1',size_bytes:24}));
    expect(result).toMatchObject({id:'proof-1',replayed:false});
  });
});
