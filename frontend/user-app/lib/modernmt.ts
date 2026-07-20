import { backendJson } from './backendApi';

type Language='ar'|'fr'|'en';

export async function translateBatch(texts:string[],target:Language,source:Language='ar'):Promise<string[]>{
  if(!texts.length||source===target)return texts;
  try{
    const result=await backendJson<{translations:string[]}>('/admin-api/v1/customer/translations',{method:'POST',body:JSON.stringify({texts,source,target})});
    return result.translations;
  }catch{return texts;}
}

export async function translateText(text:string,target:Language,source:Language='ar'):Promise<string>{
  return (await translateBatch([text],target,source))[0]||text;
}
