import {commerceRuntime,loopback} from './runtime.mjs';
import {CommerceError} from './service.mjs';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"};
const json=(body,status=200)=>Response.json(body,{status,headers});
export async function readBounded(request,max=8192){let length=0;const chunks=[];const reader=request.body?.getReader();if(!reader)return Buffer.alloc(0);while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();throw new CommerceError('too_large','Request too large.',413);}chunks.push(value);}return Buffer.concat(chunks);}
export async function commerceHttp(request,{env=process.env,runtime=commerceRuntime}={}){
 const url=new URL(request.url),route=url.pathname.split('/').at(-1);
 if(env.NETLIFY==='true'||!loopback(request.url)||env.COMMERCE_TEST_ENABLED!=='true')return route==='config'?json({enabled:false,mode:'test',reason:'Test checkout is not configured.',shippingCents:700}):json({error:'Not available.'},404);
 try{
  if(route==='config'){
   if(request.method!=='GET')return json({error:'Use GET.'},405);
   try{const r=await runtime(env);return json({enabled:true,mode:'test',shippingCents:Number(env.TEST_SHIPPING_RATE_CENTS||700),mock:r.mock});}catch{return json({enabled:false,mode:'test',shippingCents:700,reason:'Configure the sandbox key, database, catalog and webhook first.'});}
  }
  const r=await runtime(env);
  if(route==='webhook'){
   if(request.method!=='POST')return json({error:'Use POST.'},405);
   if(!env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')||r.mock)return json({error:'Webhook is not configured.'},503);
   let event;try{event=r.stripe.webhooks.constructEvent(await readBounded(request,262144),request.headers.get('Stripe-Signature'),env.STRIPE_WEBHOOK_SECRET);}catch{return json({error:'Invalid webhook signature.'},400);}
   return json(await r.service.webhook(event));
  }
  if(route==='order'){
   if(request.method!=='GET')return json({error:'Use GET.'},405);
   const result=await r.service.status(url.searchParams.get('session_id'),request.headers.get('X-Order-Token'));
   result.mock=r.mock===true;result.status=({checkout_pending:'pending',payment_pending:'pending',payment_failed:'failed'})[result.status]||result.status;return json(result);
  }
  if(route==='simulate'){
   if(!r.mock||env.COMMERCE_MOCK!=='true')return json({error:'Not available.'},404);
   if(request.method!=='POST')return json({error:'Use POST.'},405);
   if(request.headers.get('Origin')!==url.origin)return json({error:'Request origin rejected.'},403);
   let input;try{input=JSON.parse((await readBounded(request)).toString('utf8'));}catch{return json({error:'Invalid simulation.'},400);}
   if(!input||Object.keys(input).length!==2||!['paid','pending','failed','expired'].includes(input.action))return json({error:'Invalid simulation.'},400);
   await r.service.status(input.sessionId,request.headers.get('X-Order-Token'));
   const session=await r.stripe.checkout.sessions.retrieve(input.sessionId);if(!session)return json({error:'Mock session unavailable after restart. Start a new local simulation.'},409);
   const types={paid:'checkout.session.completed',pending:'checkout.session.completed',failed:'checkout.session.async_payment_failed',expired:'checkout.session.expired'};
   session.payment_status=input.action==='paid'?'paid':'unpaid';session.status=input.action==='expired'?'expired':'complete';
   session.customer_details={email:'synthetic-customer@example.invalid'};
   session.collected_information={shipping_details:{name:'Synthetic Test Customer',address:{line1:'123 Example Street',city:'Example',state:'OH',postal_code:'00000',country:'US'}}};
   await r.service.webhook({id:'evt_mock_'+input.sessionId+'_'+input.action,type:types[input.action],livemode:false,data:{object:session}});
   return json({simulated:true});
  }
  if(route==='checkout'){
   if(request.method!=='POST')return json({error:'Use POST.'},405);
   if(request.headers.get('Origin')!==url.origin)return json({error:'Request origin rejected.'},403);
   if(request.headers.get('Content-Type')?.split(';')[0]!=='application/json')return json({error:'Use JSON.'},415);
   let input;try{input=JSON.parse((await readBounded(request)).toString('utf8'));}catch(e){if(e instanceof CommerceError)throw e;return json({error:'Invalid JSON.'},400);}
   return json({...await r.service.checkout(input,{requestKey:request.headers.get('Idempotency-Key'),quoteToken:request.headers.get('X-Cart-Quote')}),mock:r.mock===true});
  }
  return json({error:'Not found.'},404);
 }catch(e){return json({error:e instanceof CommerceError?e.message:'Test commerce is unavailable. Your cart is saved.',code:e instanceof CommerceError?e.code:'unavailable',...(e instanceof CommerceError?e.details:{})},e instanceof CommerceError?e.status:503);}
}
