export interface ShopifyProduct {
  id: string;
  title: string;
  variants: {
    edges: {
      node: {
        id: string;
        price: {
          amount: string;
          currencyCode: string;
        };
      };
    }[];
  };
}

export interface ShopifyCartItem {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    product: {
      title: string;
    };
  };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  lines: {
    edges: {
      node: ShopifyCartItem;
    }[];
  };
}

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

async function shopifyFetch<T>({
  query,
  variables,
}: {
  query: string;
  variables?: Record<string, any>;
}): Promise<{ status: number; body: T } | never> {
  const endpoint = `https://${domain}/api/2024-01/graphql.json`;

  try {
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken!,
      },
      body: JSON.stringify({
        ...(query && { query }),
        ...(variables && { variables }),
      }),
    });

    const body = await result.json();

    if (body.errors) {
      throw body.errors[0];
    }

    return {
      status: result.status,
      body,
    };
  } catch (error) {
    console.error('Error:', error);
    throw {
      error,
      query,
    };
  }
}

export async function createCart(): Promise<ShopifyCart> {
  const query = `
    mutation createCart {
      cartCreate {
        cart {
          id
          checkoutUrl
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    product {
                      title
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await shopifyFetch<{ data: { cartCreate: { cart: ShopifyCart } } }>({ query });
  return response.body.data.cartCreate.cart;
}

export async function addToCart(cartId: string, lines: { merchandiseId: string; quantity: number }[]): Promise<ShopifyCart> {
  // Shopify currently doesn't natively support fractional quantities for most items unless specifically configured or sold by weight.
  // When working with yardage (e.g. 1.5 yards), consider either:
  // 1. Defining your base variant as "1/4 Yard" and multiplying the quantity appropriately.
  // 2. Using Shopify's newer decimal quantity support if available for your store.

  const query = `
    mutation addToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    product {
                      title
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    cartId,
    lines,
  };

  const response = await shopifyFetch<{ data: { cartLinesAdd: { cart: ShopifyCart } } }>({ query, variables });
  return response.body.data.cartLinesAdd.cart;
}

export async function getCart(cartId: string): Promise<ShopifyCart> {
  const query = `
    query getCart($cartId: ID!) {
      cart(id: $cartId) {
        id
        checkoutUrl
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  product {
                    title
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = { cartId };
  const response = await shopifyFetch<{ data: { cart: ShopifyCart } }>({ query, variables });
  return response.body.data.cart;
}
