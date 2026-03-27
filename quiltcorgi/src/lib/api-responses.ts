import type { ApiErrorCode } from '@/types/api';

export function unauthorizedResponse() {
  return Response.json(
    { success: false, error: 'Authentication required', code: 'UNAUTHORIZED' as ApiErrorCode },
    { status: 401 }
  );
}

export function forbiddenResponse(message = 'You do not have access to this resource.') {
  return Response.json(
    { success: false, error: message, code: 'FORBIDDEN' as ApiErrorCode },
    { status: 403 }
  );
}

export function notFoundResponse(message = 'Resource not found.') {
  return Response.json(
    { success: false, error: message, code: 'NOT_FOUND' as ApiErrorCode },
    { status: 404 }
  );
}

export function validationErrorResponse(message: string) {
  return Response.json(
    { success: false, error: message, code: 'VALIDATION_ERROR' as ApiErrorCode },
    { status: 422 }
  );
}

export function errorResponse(message: string, code: ApiErrorCode, status: number) {
  return Response.json({ success: false, error: message, code }, { status });
}
