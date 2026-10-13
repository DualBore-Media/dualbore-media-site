import {validateItems} from './catalog.js';

export const validSessionId=value=>typeof value==='string'&&/^cs_test_[A-Za-z0-9]{8,240}$/.test(value);
export const cartSignature=items=>JSON.stringify(validateItems(items).sort((a,b)=>a.variantId.localeCompare(b.variantId)));
export function validateCheckoutUrl(value){
  const url=new URL(value);
  if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com'||url.port||url.username||url.password)throw new Error('Checkout returned an invalid destination.');
  return url.href;
}
export async function checkoutRequest({items,key,quoteToken,signal,fetcher=fetch}){
  const response=await fetcher('/api/commerce/checkout',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key,...(quoteToken?{'X-Cart-Quote':quoteToken}:{})},body:JSON.stringify({items:validateItems(items)}),signal});
  const payload=await response.json();
  if(response.status===409&&payload.code==='cart_changed'){
    if(typeof payload.quoteToken!=='string'||!Array.isArray(payload.lines)||payload.lines.length!==items.length||!payload.lines.every(line=>items.some(item=>item.variantId===line.variantId&&item.quantity===line.quantity)&&Number.isSafeInteger(line.unitPriceCents)&&line.unitPriceCents>=0&&line.lineTotalCents===line.unitPriceCents*line.quantity)||new Set(payload.lines.map(line=>line.variantId)).size!==items.length)throw new Error('Price review is unavailable. Your cart is saved.');
    return {changed:true,...payload};
  }
  if(!response.ok){const error=new Error(payload.error||'Checkout is unavailable. Your cart is saved.');error.code=payload.code;throw error;}
  if(!validSessionId(payload.sessionId)||typeof payload.orderAccessToken!=='string'||payload.orderAccessToken.length<16)throw new Error('Checkout verification is unavailable. Your cart is saved.');
  return {...payload,url:validateCheckoutUrl(payload.url)};
}
export function removePurchased(current,purchased){
  validateItems(current,{allowEmpty:true});validateItems(purchased,{allowEmpty:true});
  return current.map(item=>({...item,quantity:Math.max(0,item.quantity-(purchased.find(line=>line.variantId===item.variantId)?.quantity||0))})).filter(item=>item.quantity>0);
}
export function rememberCheckout(storage,response,items){
  storage.setItem(`dbm-order-access:${response.sessionId}`,response.orderAccessToken);
  storage.setItem(`dbm-order-cart:${response.sessionId}`,JSON.stringify(validateItems(items)));
}
