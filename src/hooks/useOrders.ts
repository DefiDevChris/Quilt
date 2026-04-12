import { useState, useEffect, useCallback } from 'react';

export interface Order {
  id: string;
  userId: string | null;
  shopifyOrderId: string;
  status: string;
  totalCents: number;
  currency: string;
  subtotalCents: number | null;
  taxCents: number | null;
  shippingCents: number | null;
  lineItems: any;
  shippingAddress: any;
  checkoutUrl: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetail extends Order {
  statusHistory: Array<{
    id: string;
    orderId: string;
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    createdAt: string;
  }>;
}

interface UseOrdersOptions {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
}

/**
 * Hook for fetching and managing orders
 */
export function useOrders(options: UseOrdersOptions = {}): UseOrdersResult {
  const { page = 1, limit = 20, status, startDate, endDate } = options;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseOrdersResult['pagination']>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (status) params.set('status', status);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/orders?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch orders');
      }

      setOrders(result.data.orders);
      setPagination(result.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    pagination,
    refetch: fetchOrders,
  };
}

/**
 * Hook for fetching a single order by ID
 */
export function useOrder(id: string | null) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setOrder(null);
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/orders/${id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch order');
        }

        setOrder(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  return {
    order,
    loading,
    error,
  };
}
