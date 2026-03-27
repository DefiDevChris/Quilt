import { auth } from '@/lib/auth';

export {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/api-responses';

export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session;
}
