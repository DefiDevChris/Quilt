import { NextRequest, NextResponse } from 'next/server';
import { isShopifyEnabled, createCart, addToCart, getCart } from '@/lib/shopify';

/**
 * POST /api/shop/cart
 * 
 * Handles cart operations:
 * - Create a new cart (no body required)
 * - Add items to cart ({ action: 'add', lines: [...] })
 * - Get cart ({ action: 'get', cartId: '...' })
 * 
 * Note: For the Storefront API, most cart operations can be done client-side.
 * This endpoint is provided for server-side operations if needed (e.g., validation,
 * logging, or complex business logic).
 */
export async function POST(request: NextRequest) {
  try {
    if (!isShopifyEnabled()) {
      return NextResponse.json(
        { error: 'Shopify integration is not enabled' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, cartId, lines } = body;

    switch (action) {
      case 'create': {
        const result = await createCart();
        return NextResponse.json({
          success: true,
          data: result,
        });
      }

      case 'add': {
        if (!cartId || !lines || !Array.isArray(lines)) {
          return NextResponse.json(
            { error: 'cartId and lines array are required' },
            { status: 400 }
          );
        }

        const cart = await addToCart(cartId, lines);
        return NextResponse.json({
          success: true,
          data: cart,
        });
      }

      case 'get': {
        if (!cartId) {
          return NextResponse.json(
            { error: 'cartId is required' },
            { status: 400 }
          );
        }

        const cart = await getCart(cartId);
        if (!cart) {
          return NextResponse.json(
            { error: 'Cart not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: cart,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create, add, or get' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Shopify cart API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process cart operation',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shop/cart?cartId=...
 * 
 * Retrieve cart contents by ID
 */
export async function GET(request: NextRequest) {
  try {
    if (!isShopifyEnabled()) {
      return NextResponse.json(
        { error: 'Shopify integration is not enabled' },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const cartId = searchParams.get('cartId');

    if (!cartId) {
      return NextResponse.json(
        { error: 'cartId query parameter is required' },
        { status: 400 }
      );
    }

    const cart = await getCart(cartId);
    
    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error('Shopify cart GET error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to retrieve cart',
      },
      { status: 500 }
    );
  }
}
