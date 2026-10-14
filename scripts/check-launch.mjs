import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

export const requiredDeclarations=['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','DATABASE_URL','RESEND_API_KEY','RESEND_FROM','RESEND_REPLY_TO','CLERK_SECRET_KEY','CLERK_PUBLISHABLE_KEY','PAYMENTS_ENABLED','TRANSACTIONAL_EMAILS_ENABLED'];
export function checkLaunch({policyText='',catalogText='',declarations='',env={}}={}) {
  const blockers=[];
  if(!policyText.trim() || /\[[^\]]*REQUIRED\]|TODO|placeholder|draft for review|not an approved|still need confirmation|review required|policy pending|owner decisions still required/i.test(policyText)) blockers.push('Customer policies contain draft or placeholder wording.');
  if(!catalogText.trim() || /test data|test-only|draft catalog|test pricing|testPrice|isTest\s*:\s*true|testOnly\s*:\s*true|price_test_|prod_test_|price_[^\s"']*test/i.test(catalogText)) blockers.push('Catalog remains test data or has no reviewed live catalog.');
  for(const name of requiredDeclarations) {
    if(!new RegExp(`^${name}=`, 'm').test(declarations)) blockers.push(`Environment declaration missing: ${name}.`);
    if(!env[name]) blockers.push(`Production configuration missing: ${name}.`);
  }
  if(env.STRIPE_SECRET_KEY && !/^(sk|rk)_live_/.test(env.STRIPE_SECRET_KEY)) blockers.push('Stripe is not configured for reviewed live mode.');
  if(env.DATABASE_URL && !/^postgres(?:ql)?:\/\//.test(env.DATABASE_URL)) blockers.push('A PostgreSQL connection is required.');
  if(env.STORE_COUNTRY!=='US' || env.STORE_CURRENCY!=='usd') blockers.push('USA/USD shipping and currency configuration is unverified.');
  if(!/^\d+$/.test(env.SHIPPING_RATE_CENTS ?? '') || Number(env.SHIPPING_RATE_CENTS)<=0 || env.SHIPPING_CONFIGURATION_APPROVED!=='true') blockers.push('Final production shipping price and configuration require approval.');
  for(const name of ['BUSINESS_LEGAL_NAME','BUSINESS_POSTAL_ADDRESS','SUPPORT_EMAIL']) if(!env[name] || /TODO|placeholder|example\./i.test(env[name])) blockers.push(`Business information missing or unverified: ${name}.`);
  if(env.POLICIES_APPROVED!=='true') blockers.push('Final customer policies have not been approved.');
  if(env.LIVE_CATALOG_APPROVED!=='true') blockers.push('Live prices, inventory and Stripe catalog require approval.');
  if(env.TAX_CONFIGURATION_APPROVED!=='true') blockers.push('Tax configuration requires owner/professional review.');
  if(env.RESEND_DOMAIN_VERIFIED!=='true') blockers.push('Transactional sender domain is not confirmed as verified.');
  if(!env.RESEND_FROM||/resend\.dev|example\./i.test(env.RESEND_FROM))blockers.push('Production email domain required.');
  if(!env.RESEND_REPLY_TO||/example\./i.test(env.RESEND_REPLY_TO))blockers.push('A confirmed monitored reply-to address is required.');
  if(!env.CLERK_SECRET_KEY?.startsWith('sk_live_')||!env.CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_'))blockers.push('Production Clerk instance keys are missing or not live.');
  if(!env.CLERK_FRONTEND_ORIGIN||!/^https:\/\//.test(env.CLERK_FRONTEND_ORIGIN))blockers.push('Exact production Clerk frontend origin/CSP configuration is missing.');
  if(env.COMMERCE_ENVIRONMENT!=='production')blockers.push('Production environment is not selected.');
  for(const [key,message]of Object.entries({SECURITY_REVIEW_PASSED:'Critical/high security findings require resolution.',REQUIRED_TESTS_PASSED:'Required release-candidate tests need fresh passing evidence.',MIGRATIONS_VERIFIED:'Production migrations require verification.',MARKETING_SUPPRESSION_VERIFIED:'Durable production marketing suppression requires verification.',FRONTEND_PRODUCTION_QA_VERIFIED:'The configured production-shaped frontend requires rendered verification.',AUTH_PRODUCTION_VERIFIED:'Managed production sign-in, verification, recovery and sessions require real validation.',ADMIN_MFA_VERIFIED:'Administrator MFA and role authorization require real validation.',PRODUCTION_DATABASE_VERIFIED:'A separate production database and applied migrations require verification.',DATABASE_BACKUP_RESTORE_VERIFIED:'Production backup and restore rehearsal is required.',STRIPE_WEBHOOK_VERIFIED:'Post-deployment live Stripe webhook signature and event delivery require verification.',RESEND_DELIVERY_VERIFIED:'Production sender delivery and lifecycle retry require verification.',PROCESSING_TIME_APPROVED:'Final processing time is missing.',RETURN_WINDOW_APPROVED:'Final return window is missing.',RETENTION_POLICY_APPROVED:'Data retention and account deletion policy require approval.',SUPPORT_WORKFLOW_APPROVED:'Support inbox and response workflow require confirmation.',LIVE_INVENTORY_APPROVED:'Real production inventory must be counted and approved.'}))if(env[key]!=='true')blockers.push(message);
  if(env.PAYMENTS_ENABLED!=='true')blockers.push('Payments remain intentionally disabled pending explicit launch approval.');
  if(env.TRANSACTIONAL_EMAILS_ENABLED!=='true')blockers.push('Production transactional email remains intentionally disabled.');
  return {ready:blockers.length===0,blockers};
}

export async function runLaunchCheck({root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),env=process.env}={}) {
  const read=async path=>{try{return await readFile(resolve(root,path),'utf8');}catch{return '';}};
  const [policyText,catalog,serverCatalog,declarations]=await Promise.all([read('src/commerce/Pages.jsx'),read('src/commerce/catalog.js'),read('netlify/commerce/catalog.mjs'),read('.env.example')]);
  const result=checkLaunch({policyText,catalogText:`${catalog}\n${serverCatalog}`,declarations,env});
  return result;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const result=await runLaunchCheck();
  console.log(result.ready?'Launch configuration checks passed. No deployment was performed.':`Launch blocked (${result.blockers.length}):\n${result.blockers.map(item=>`- ${item}`).join('\n')}\nNo deployment was performed.`);
  process.exitCode=result.ready?0:1;
}
