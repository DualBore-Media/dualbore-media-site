import test from 'node:test';import assert from 'node:assert/strict';import Stripe from 'stripe';
import {commerceHttp} from '../netlify/commerce/http.mjs';
const env={COMMERCE_TEST_ENABLED:'true',STRIPE_WEBHOOK_SECRET:'whsec_local_synthetic_only'};
const url='http://127.0.0.1:4176/api/commerce/';
test('checkout HTTP boundary is loopback-only, opt-in, bounded, POST and same-origin',async()=>{
 const runtime=async()=>({service:{checkout:async()=>({ok:true})}});
 const call=(route,init={})=>commerceHttp(new Request(url+route,init),{env,runtime});
 assert.equal((await commerceHttp(new Request('https://example.com/api/commerce/checkout'),{env,runtime})).status,404);
 assert.equal((await call('checkout')).status,405);
 assert.equal((await call('checkout',{method:'POST'})).status,403);
 assert.equal((await call('checkout',{method:'POST',headers:{Origin:'http://127.0.0.1:4176','Content-Type':'application/json'},body:'bad'})).status,400);
 assert.equal((await call('checkout',{method:'POST',headers:{Origin:'http://127.0.0.1:4176','Content-Type':'application/json'},body:'x'.repeat(9000)})).status,413);
});
test('webhook uses official SDK raw signature verification and rejects forged/missing signatures',async()=>{
 const stripe=new Stripe('sk_test_synthetic_not_a_credential');let calls=0;const runtime=async()=>({stripe,service:{webhook:async e=>{calls++;assert.equal(e.livemode,false);return{received:true};}}});
 const body=JSON.stringify({id:'evt_mockverified',livemode:false,type:'checkout.session.completed',data:{object:{}}});
 const request=signature=>new Request(url+'webhook',{method:'POST',headers:signature?{'Stripe-Signature':signature}:{},body});
 assert.equal((await commerceHttp(request(),{env,runtime})).status,400);assert.equal((await commerceHttp(request('bad'),{env,runtime})).status,400);
 const signature=stripe.webhooks.generateTestHeaderString({payload:body,secret:env.STRIPE_WEBHOOK_SECRET});const response=await commerceHttp(request(signature),{env,runtime});assert.equal(response.status,200);assert.equal(calls,1);
 assert.equal(response.headers.get('Cache-Control'),'no-store');
});
