import { NextResponse } from 'next/server';
import { createCart, addToCart, getCart } from '@/lib/shopify';

export async function POST(request: Request) {
  try {
    const { action, cartId, lines } = await request.json();

    if (action === 'create') {
      const cart = await createCart();
      return NextResponse.json(cart);
    }

    if (action === 'add') {
      if (!cartId || !lines || !Array.isArray(lines)) {
        return NextResponse.json({ error: 'Missing cartId or lines array' }, { status: 400 });
      }
      const updatedCart = await addToCart(cartId, lines);
      return NextResponse.json(updatedCart);
    }

    if (action === 'get') {
      if (!cartId) {
        return NextResponse.json({ error: 'Missing cartId' }, { status: 400 });
      }
      const cart = await getCart(cartId);
      return NextResponse.json(cart);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('API Shop Cart Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
