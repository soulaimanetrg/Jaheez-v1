import { backendJson } from '@/lib/backendApi';

export type ResolvedDeliveryPlace={city:string;address:string;area:string};

export async function reverseDeliveryPlace(latitude:number,longitude:number):Promise<ResolvedDeliveryPlace>{
  const place=await backendJson<ResolvedDeliveryPlace|null>('/admin-api/v1/customer/location/reverse',{method:'POST',body:JSON.stringify({lat:latitude,lng:longitude})});
  if(!place)throw new Error('address_not_found');
  return place;
}

export async function getDeliveryMapConfig(){return backendJson<{initial_region:{latitude:number;longitude:number;latitude_delta:number;longitude_delta:number}}>('/admin-api/v1/customer/location/config')}

export async function searchDeliveryPlaces(query:string){return backendJson<Array<{place_id:string;label:string;city:string;latitude:number;longitude:number}>>(`/admin-api/v1/customer/location/search?q=${encodeURIComponent(query)}`)}
