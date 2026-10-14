// Clerk is the sole authentication authority. No cookie or client role is trusted here.
export class AuthError extends Error {
  constructor(code, message, status = 401) { super(message); this.name = 'AuthError'; Object.assign(this, {code, status}); }
}
const deny = () => { throw new AuthError('sign_in_required', 'Please sign in again to continue.'); };
const unavailable = () => { throw new AuthError('auth_unavailable', 'Account access is temporarily unavailable.', 503); };

export async function authenticate(request, {env = process.env, client} = {}) {
  let origin;
  try {
    const configured = new URL(env.SITE_ORIGIN);
    if (configured.username || configured.password || configured.pathname !== '/' || configured.search || configured.hash) unavailable();
    if (configured.protocol !== 'https:' && !(configured.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(configured.hostname))) unavailable();
    origin = configured.origin;
  } catch (error) { if (error instanceof AuthError) throw error; unavailable(); }
  if (!env.CLERK_SECRET_KEY || !(env.CLERK_PUBLISHABLE_KEY || env.VITE_CLERK_PUBLISHABLE_KEY)) unavailable();
  if(env.COMMERCE_ENVIRONMENT==='production'&&(!env.CLERK_SECRET_KEY.startsWith('sk_live_')||!(env.CLERK_PUBLISHABLE_KEY||env.VITE_CLERK_PUBLISHABLE_KEY).startsWith('pk_live_')))unavailable();
  const authorization = request.headers.get('Authorization');
  // The managed frontend supplies a session Bearer token. Cookies are never an API fallback.
  if (!authorization || !/^Bearer [A-Za-z0-9_.-]+$/.test(authorization) || authorization.length > 16384) deny();
  if (new URL(request.url).origin !== origin || (request.headers.has('Origin') && request.headers.get('Origin') !== origin)) {
    throw new AuthError('origin_rejected', 'Please open your account on the DualBore Media website.', 403);
  }
  try {
    if (!client) {
      const {createClerkClient} = await import('@clerk/backend');
      client = createClerkClient({secretKey: env.CLERK_SECRET_KEY, publishableKey: env.CLERK_PUBLISHABLE_KEY || env.VITE_CLERK_PUBLISHABLE_KEY});
    }
    const bearerRequest = new Request(request.url, {headers: {Authorization: authorization}});
    const verified = await client.authenticateRequest(bearerRequest, {authorizedParties: [origin], acceptsToken: 'session_token'});
    if (!verified.isAuthenticated || verified.tokenType !== 'session_token') deny();
    const auth = verified.toAuth();
    const claims = auth.sessionClaims || auth.claims;
    if (!auth.userId || !auth.sessionId || claims?.azp !== origin || auth.actor) deny();
    // Signature validation alone cannot immediately observe account deletion/session revocation.
    const [session, user] = await Promise.all([client.sessions.getSession(auth.sessionId), client.users.getUser(auth.userId)]);
    if (session.id !== auth.sessionId || session.userId !== auth.userId || session.status !== 'active' || session.actor ||
        !Number.isFinite(session.expireAt) || session.expireAt <= Date.now() || user.id !== auth.userId || user.deleted || user.banned || user.locked) deny();
    const primary = user.emailAddresses?.find(email => email.id === user.primaryEmailAddressId);
    if (!primary || primary.verification?.status !== 'verified' || typeof primary.emailAddress !== 'string' || !primary.emailAddress.includes('@')) {
      throw new AuthError('email_verification_required', 'Verify your primary email address before accessing orders.', 403);
    }
    const secondFactorAge = auth.factorVerificationAge?.[1];
    const mfa = user.twoFactorEnabled === true && Number.isFinite(secondFactorAge) && secondFactorAge >= 0 && secondFactorAge <= 10;
    return Object.freeze({userId: user.id, sessionId: session.id, email: primary.emailAddress.trim().toLowerCase(),
      displayName: [user.firstName, user.lastName].filter(value => typeof value === 'string').join(' ').slice(0, 160),
      admin: user.privateMetadata?.role === 'admin', mfa, mfaEnrolled:user.twoFactorEnabled===true});
  } catch (error) {
    if (error instanceof AuthError) throw error;
    // Provider diagnostics may contain tokens or customer data. They never enter HTTP responses/logs.
    if (error?.status === 404 || error?.status === 401 || error?.status === 403) deny();
    unavailable();
  }
}

export function requireAdmin(principal) {
  if (!principal?.admin) throw new AuthError('admin_required', 'Administrator access is required.', 403);
  if (!principal.mfa) {const error=new AuthError('mfa_required', 'Enroll MFA in your secure profile and verify a second factor within the last 10 minutes to continue.', 403);error.reverify=principal.mfaEnrolled===true;throw error;}
  return principal;
}
