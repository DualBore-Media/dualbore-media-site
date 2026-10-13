import test from 'node:test';
import assert from 'node:assert/strict';
import {checkLaunch,requiredDeclarations,runLaunchCheck} from '../scripts/check-launch.mjs';
const configuration={policyText:'Final approved customer policies.',catalogText:'Reviewed catalog.',declarations:requiredDeclarations.map(name=>`${name}=`).join('\n'),env:{STRIPE_SECRET_KEY:'sk_live_placeholder-for-test',STRIPE_WEBHOOK_SECRET:'mock',DATABASE_URL:'postgresql://mock',RESEND_API_KEY:'mock',RESEND_FROM:'orders@example.org',STORE_COUNTRY:'US',STORE_CURRENCY:'usd',SHIPPING_RATE_CENTS:'700',SHIPPING_CONFIGURATION_APPROVED:'true',BUSINESS_LEGAL_NAME:'Reviewed Company',BUSINESS_POSTAL_ADDRESS:'Reviewed postal address',SUPPORT_EMAIL:'support@business.org',POLICIES_APPROVED:'true',LIVE_CATALOG_APPROVED:'true',TAX_CONFIGURATION_APPROVED:'true',RESEND_DOMAIN_VERIFIED:'true'}};
test('launch checks explicitly approved configuration without performing deployment',()=>{assert.equal(checkLaunch(configuration).ready,true);});
test('launch validator blocks legal placeholders and test-only catalogs',()=>{
  for(const policyText of ['TODO business address','Draft for review','This is not an approved customer policy','Return policy pending']) assert.equal(checkLaunch({...configuration,policyText}).ready,false);
  for(const catalogText of ['TEST DATA','Draft catalog only','isTest: true','price_test_123']) assert.equal(checkLaunch({...configuration,catalogText}).ready,false);
});
test('launch validator catches missing declarations, test secret, shipping and business gaps',()=>{
  const result=checkLaunch({...configuration,declarations:'',env:{...configuration.env,STRIPE_SECRET_KEY:'sk_test_mock',SHIPPING_CONFIGURATION_APPROVED:'false',BUSINESS_POSTAL_ADDRESS:'TODO',SUPPORT_EMAIL:''}});assert.ok(result.blockers.some(item=>item.includes('declaration')));assert.ok(result.blockers.some(item=>item.includes('live mode')));assert.ok(result.blockers.some(item=>item.includes('shipping')));assert.ok(result.blockers.some(item=>item.includes('POSTAL_ADDRESS')));
});
test('current local site remains blocked from launch with safe diagnostics',async()=>{
  const result=await runLaunchCheck({env:{}});assert.equal(result.ready,false);assert.ok(result.blockers.length>5);assert.ok(!JSON.stringify(result).includes('postgresql://'));
});
