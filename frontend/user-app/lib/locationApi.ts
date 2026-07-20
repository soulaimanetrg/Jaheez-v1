import { backendJson } from './backendApi';

export type MapRegion={latitude:number;longitude:number;latitude_delta:number;longitude_delta:number};
export type LocationResult={place_id:string;label:string;city:string;latitude:number;longitude:number};
export type ResolvedLocation={city:string;address:string;area:string;place_id:string|null};

export const getLocationConfig=()=>backendJson<{initial_region:MapRegion}>('/admin-api/v1/customer/location/config');
export const searchLocations=(q:string)=>backendJson<LocationResult[]>(`/admin-api/v1/customer/location/search?q=${encodeURIComponent(q)}`);
export const reverseLocation=(lat:number,lng:number)=>backendJson<ResolvedLocation|null>('/admin-api/v1/customer/location/reverse',{method:'POST',body:JSON.stringify({lat,lng})});
