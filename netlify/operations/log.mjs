import{randomUUID}from'node:crypto';
// Whitelisted metadata only. Never pass an Error, request headers, token or body.
export function operationLog(scope,category,{eventId,status,log=console.warn}={}){
 const requestId=randomUUID();log('[dualbore]',JSON.stringify({requestId,scope:String(scope).slice(0,40),category:String(category).replace(/[^a-z0-9_-]/gi,'').slice(0,80),...(typeof eventId==='string'&&/^evt_[A-Za-z0-9_]{1,200}$/.test(eventId)?{eventId}:{}),...(Number.isInteger(status)?{status}:{})}));return requestId;
}
