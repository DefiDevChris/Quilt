import { getSession } from '@/lib/cognito-session';

export {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/api-responses';

export async function getRequiredSession() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }
  return session;
}
