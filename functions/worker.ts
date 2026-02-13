// Cloudflare Worker API for Multi-Tenant SaaS
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Environment bindings
export interface Env {
  DB: D1Database;
  IMAGES_BUCKET: R2Bucket;
  AUTH_ISSUER: string;
  AUTH_AUDIENCE: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_ID_STUDIO_MONTHLY: string;
  STRIPE_PRICE_ID_STUDIO_LIFETIME: string;
  STRIPE_PRICE_ID_BESPOKE_SETUP: string;
  STRIPE_PRICE_ID_BESPOKE_MONTHLY: string;
}

export interface AuthContext {
  userId: string;
  studioId: string;
  studioStatus: string;
  planType: string | null;
}

// JWT verification middleware
async function verifyJWT(request: Request, env: Env): Promise<AuthContext | Response> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    const JWKS = createRemoteJWKSet(
      new URL(`${env.AUTH_ISSUER}/.well-known/jwks.json`)
    );

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: env.AUTH_ISSUER,
      audience: env.AUTH_AUDIENCE,
    });

    const authProviderUserId = payload.sub;
    if (!authProviderUserId) {
      return new Response('Invalid token', { status: 401 });
    }

    const user = await env.DB.prepare(
      'SELECT id, studio_id FROM users WHERE auth_provider_user_id = ?'
    ).bind(authProviderUserId).first<{ id: string; studio_id: string }>();

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    const studio = await env.DB.prepare(
      'SELECT status, plan_type FROM studios WHERE id = ?'
    ).bind(user.studio_id).first<{ status: string; plan_type: string | null }>();

    if (!studio) {
      return new Response('Studio not found', { status: 404 });
    }

    return {
      userId: user.id,
      studioId: user.studio_id,
      studioStatus: studio.status,
      planType: studio.plan_type,
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return new Response('Unauthorized', { status: 401 });
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function handleCORS(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsResponse = handleCORS(request);
    if (corsResponse) return corsResponse;

    const authResult = await verifyJWT(request, env);
    if (authResult instanceof Response) return authResult;

    return new Response('OK');
  },
};
