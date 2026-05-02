export type { ApiErrorCode } from '@/lib/api-responses';

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
