import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { setAuthCookies } from '@/lib/cognito-session';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface TokenResponse {
  id_token: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return Response.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code) {
    return Response.redirect(
      new URL('/auth/signin?error=missing_code', req.url)
    );
  }

  try {
    const domain = process.env.COGNITO_DOMAIN ?? process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.COGNITO_CLIENT_ID;
    const region = process.env.COGNITO_REGION ?? 'us-east-1';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    if (!domain || !clientId) {
      return Response.redirect(
        new URL('/auth/signin?error=not_configured', req.url)
      );
    }

    const cognitoDomain = domain.includes('.auth.')
      ? domain
      : `${domain}.auth.${region}.amazoncognito.com`;

    const tokenRes = await fetch(`https://${cognitoDomain}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        redirect_uri: `${appUrl}/auth/callback`,
      }),
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.json().catch(() => ({}));
      return Response.redirect(
        new URL(
          `/auth/signin?error=${encodeURIComponent(errData.error_description ?? 'token_exchange_failed')}`,
          req.url
        )
      );
    }

    const tokens: TokenResponse = await tokenRes.json();

    await setAuthCookies({
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });

    // Decode id_token to get user info (JWT payload)
    const payload = JSON.parse(
      Buffer.from(tokens.id_token.split('.')[1], 'base64').toString()
    );

    const email = payload.email ?? '';
    const name = payload.name ?? payload.given_name ?? email.split('@')[0];
    const sub = payload.sub ?? '';

    // Sync user to DB
    const [existing] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existing) {
      await db
        .insert(users)
        .values({
          email,
          name,
          role: 'free',
          emailVerified: new Date(),
          cognitoSub: sub,
        })
        .onConflictDoNothing({ target: users.email });
    }

    return Response.redirect(new URL('/dashboard', req.url));
  } catch {
    return Response.redirect(
      new URL('/auth/signin?error=callback_failed', req.url)
    );
  }
}
