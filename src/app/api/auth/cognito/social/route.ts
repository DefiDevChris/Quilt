import { NextRequest } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  provider: z.enum(['Google', 'SignInWithApple']),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const { provider } = parsed.data;
    const domain = process.env.COGNITO_DOMAIN ?? process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.COGNITO_CLIENT_ID;
    const region = process.env.COGNITO_REGION ?? 'us-east-1';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    if (!domain || !clientId) {
      return Response.json(
        { error: 'Social login is not configured' },
        { status: 503 }
      );
    }

    const redirectUri = `${appUrl}/auth/callback`;
    const cognitoDomain = domain.includes('.auth.')
      ? domain
      : `${domain}.auth.${region}.amazoncognito.com`;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: 'openid email profile',
      redirect_uri: redirectUri,
      identity_provider: provider,
    });

    const url = `https://${cognitoDomain}/oauth2/authorize?${params.toString()}`;
    return Response.json({ url });
  } catch {
    return Response.json({ error: 'Failed to initiate social login' }, { status: 500 });
  }
}
