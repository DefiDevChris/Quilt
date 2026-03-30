export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'PRO_REQUIRED'
  | 'PROJECT_LIMIT_REACHED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'ALREADY_SHARED'
  | 'DUPLICATE_REPORT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'TRUST_INSUFFICIENT'
  | 'INTERNAL_ERROR';

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ApiErrorCode };

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
