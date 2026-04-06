import { useToast } from '@/components/ui/ToastProvider';

interface CheckoutResult {
  success: boolean;
  data?: { checkoutUrl?: string };
  error?: string;
}

export async function startStripeCheckout(body?: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
    const data: CheckoutResult = await res.json();
    if (data.success && data.data?.checkoutUrl) {
      window.location.href = data.data.checkoutUrl;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function useStripeCheckout() {
  const { toast } = useToast();

  async function handleCheckout(body?: Record<string, unknown>) {
    const ok = await startStripeCheckout(body);
    if (!ok) {
      toast({
        type: 'error',
        title: 'Checkout failed',
        description: 'Unable to start checkout. Please try again.',
      });
    }
  }

  return { handleCheckout };
}
