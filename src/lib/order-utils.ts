/**
 * Order utilities for formatting, status mapping, and display
 */

export type OrderStatus = 'pending' | 'confirmed' | 'fulfilled' | 'cancelled' | 'refunded';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#fbbf24',
  confirmed: '#3b82f6',
  fulfilled: '#22c55e',
  cancelled: 'var(--color-error)',
  refunded: 'var(--color-error)',
};

export const ORDER_STATUS_BG_LIGHT: Record<OrderStatus, string> = {
  pending: '#fef3c7',
  confirmed: '#dbeafe',
  fulfilled: '#dcfce7',
  cancelled: 'var(--color-accent-blush)',
  refunded: 'var(--color-accent-blush)',
};

/**
 * Format order status for display
 */
export function formatOrderStatus(status: string): {
  label: string;
  color: string;
  bgLight: string;
} {
  const normalizedStatus = status.toLowerCase() as OrderStatus;
  return {
    label: ORDER_STATUS_LABELS[normalizedStatus] || status,
    color: ORDER_STATUS_COLORS[normalizedStatus] || '#6b7280',
    bgLight: ORDER_STATUS_BG_LIGHT[normalizedStatus] || '#f3f4f6',
  };
}

/**
 * Format currency from cents
 */
export function formatCents(cents: number, currency: string = 'usd'): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(dollars);
}

/**
 * Format order date for display
 */
export function formatOrderDate(date: Date | string | null): string {
  if (!date) return 'Unknown';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Map Shopify order status to our internal status
 */
export function mapShopifyOrderStatus(
  financialStatus: string | null,
  fulfillmentStatus: string | null
): OrderStatus {
  // Shopify fulfillment status takes precedence
  if (fulfillmentStatus === 'fulfilled') {
    return 'fulfilled';
  }
  if (fulfillmentStatus === 'cancelled') {
    return 'cancelled';
  }

  // Financial status
  if (financialStatus === 'paid') {
    return 'confirmed';
  }
  if (financialStatus === 'refunded') {
    return 'refunded';
  }
  if (financialStatus === 'voided') {
    return 'cancelled';
  }

  return 'pending';
}

export interface OrderLineItem {
  fabricId: string;
  fabricName: string;
  quantityInYards: number;
  pricePerYard: number;
  imageUrl: string | null;
  shopifyVariantId?: string;
}

export interface OrderShippingAddress {
  name?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  zip?: string | null;
  phone?: string | null;
}

/**
 * Calculate order total from line items
 */
export function calculateLineItemsTotal(items: OrderLineItem[]): number {
  return items.reduce((total, item) => {
    return total + item.quantityInYards * item.pricePerYard;
  }, 0);
}

/**
 * Format address for display
 */
export function formatAddress(address: OrderShippingAddress | null): string {
  if (!address) return '';

  const parts = [
    address.name,
    address.address1,
    address.address2,
    [address.city, address.province, address.zip].filter(Boolean).join(', '),
    address.country,
  ].filter(Boolean);

  return parts.join('\n');
}
