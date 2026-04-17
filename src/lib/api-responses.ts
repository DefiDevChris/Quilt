type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'PRO_REQUIRED'
  | 'PROJECT_LIMIT_REACHED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'USERNAME_CONFLICT'
  | 'SLUG_CONFLICT';

export function unauthorizedResponse(message = 'Authentication required') {
  return Response.json(
    { success: false, error: message, code: 'UNAUTHORIZED' as ApiErrorCode },
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
