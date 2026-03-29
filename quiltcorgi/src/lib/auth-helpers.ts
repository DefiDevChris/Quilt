import { getSession, type CognitoSession } from '@/lib/cognito-session';

export {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/api-responses';

// DEV BYPASS — remove before production deploy
const DEV_SESSION: CognitoSession = {
  user: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'dev@localhost',
    name: 'Dev User',
    role: 'pro',
    emailVerified: true,
  },
  accessToken: 'dev-token',
};

export async function getRequiredSession() {
  if (process.env.NODE_ENV === 'development') {
    return DEV_SESSION;
  }
  const session = await getSession();
  if (!session?.user) {
    return null;
  }
  return session;
}
