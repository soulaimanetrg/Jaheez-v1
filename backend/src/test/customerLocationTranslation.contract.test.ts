import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe,expect,it } from 'vitest';

const root=resolve(__dirname,'../../..');
const read=(path:string)=>readFileSync(resolve(root,path),'utf8');

describe('customer location and translation boundary',()=>{
  it('keeps Google Places, geocoding, and ModernMT behind authenticated backend routes',()=>{
    const routes=read('backend/src/features/customer/customer.routes.ts');
    const location=read('backend/src/features/customer/customerLocation.service.ts');
    const translation=read('backend/src/features/customer/customerTranslation.service.ts');
    expect(routes).toContain("router.use('/v1/customer', verifyCustomerJwt)");
    expect(routes).toContain("'/v1/customer/location/search'");
    expect(routes).toContain("'/v1/customer/translations'");
    expect(location).toContain('GOOGLE_MAPS_SERVER_API_KEY');
    expect(location).toContain('places.googleapis.com/v1/places:searchText');
    expect(translation).toContain('MODERNMT_API_KEY');
  });

  it('keeps provider calls and secrets out of the customer app',()=>{
    const locationClient=read('frontend/user-app/lib/locationApi.ts');
    const translationClient=read('frontend/user-app/lib/modernmt.ts');
    expect(locationClient).not.toContain('googleapis.com');
    expect(translationClient).not.toContain('api.modernmt.com');
    expect(translationClient).not.toContain('EXPO_PUBLIC_MODERNMT');
  });
});
