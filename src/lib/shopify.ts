/**
 * Shopify Storefront API Client
 * 
 * This module provides a lightweight GraphQL client for interacting with
 * the Shopify Storefront API using Next.js native fetch.
 * 
 * ENVIRONMENT VARIABLES REQUIRED:
 * - NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: Your Shopify store domain (e.g., "my-store.myshopify.com")
 * - NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: Your Storefront API access token
 * 
 * FEATURE FLAG:
 * - NEXT_PUBLIC_ENABLE_SHOP: Set to 'true' to enable Shopify integration
 * 
 * NOTE ON DECIMAL QUANTITIES IN SHOPIFY:
 * Shopify's Storefront API supports decimal quantities if enabled in your store settings.
 * If your store does NOT support decimal quantities, you have two options:
 * 
 * Option 1: Enable decimal quantities in Shopify Admin
 *   - Go to Settings > Products > Inventory
 *   - Enable "Track quantity" and allow decimal values
 *   - This allows customers to add e.g., 1.5 yards directly
 * 
 * Option 2: Use smaller base units (recommended for fabric stores)
 *   - Create product variants where 1 unit = 0.25 yards (or 0.5 yards)
 *   - Convert yardage to base units before adding to cart:
 *     const baseUnits = Math.ceil(yards / 0.25); // For quarter-yard increments
 *   - Display to users as "1.5 yards" but send "6" units to Shopify
 * 
 * For this implementation, we assume decimal quantities are ENABLED in Shopify.
 * If not, modify the addToCart function to convert yards to your base unit.
 */

const shopifyDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const isShopEnabled = process.env.NEXT_PUBLIC_ENABLE_SHOP === 'true';

const SHOPIFY_GRAPHQL_ENDPOINT = shopifyDomain
  ? `https://${shopifyDomain}/api/2024-01/graphql.json`
  : '';

const HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  'X-Shopify-Storefront-Access-Token': storefrontToken || '',
};

/**
 * Generic GraphQL request helper
 */
async function shopifyGraphQLRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!isShopEnabled) {
    throw new Error('Shopify integration is disabled. Set NEXT_PUBLIC_ENABLE_SHOP=true');
  }

  if (!shopifyDomain || !storefrontToken) {
    throw new Error('Shopify environment variables not configured');
  }

  const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data as T;
}

// ============================================================
// GraphQL Queries & Mutations
// ============================================================

/**
 * Create a new cart
 * Returns: cartId and checkoutUrl
 */
const CREATE_CART_MUTATION = `
  mutation cartCreate($input: CartInput) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * Add items to an existing cart
 * Takes: cartId and lines array with variantId and quantity
 */
const ADD_TO_CART_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 250) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
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

/**
 * Get cart contents
 * Takes: cartId
 */
const GET_CART_QUERY = `
  query cart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      createdAt
      updatedAt
      lines(first: 250) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                price {
                  amount
                  currencyCode
                }
                product {
                  title
                  images(first: 1) {
                    edges {
                      node {
                        url
                      }
                    }
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

// ============================================================
// Public API Functions
// ============================================================

export interface ShopifyCartLineInput {
  variantId: string;
  quantity: number;
  /** Optional: custom attributes for the line item */
  attributes?: Array<{ key: string; value: string }>;
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: {
      amount: string;
      currencyCode: string;
    };
    product: {
      title: string;
      images?: {
        edges: Array<{ node: { url: string } }>;
      };
    };
  };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  createdAt: string;
  updatedAt: string;
  lines: ShopifyCartLine[];
}

export interface CreateCartResult {
  cartId: string;
  checkoutUrl: string;
}

/**
 * Create a new Shopify cart
 */
export async function createCart(): Promise<CreateCartResult> {
  const data = await shopifyGraphQLRequest<{
    cartCreate: { cart: { id: string; checkoutUrl: string } };
  }>(CREATE_CART_MUTATION, { input: {} });

  return {
    cartId: data.cartCreate.cart.id,
    checkoutUrl: data.cartCreate.cart.checkoutUrl,
  };
}

/**
 * Add items to an existing cart
 * @param cartId - The Shopify cart ID
 * @param lines - Array of variant IDs and quantities
 * 
 * NOTE: Quantity can be a decimal if your Shopify store supports it.
 * See the note at the top of this file about handling decimal quantities.
 */
export async function addToCart(
  cartId: string,
  lines: ShopifyCartLineInput[]
): Promise<ShopifyCart> {
  const data = await shopifyGraphQLRequest<{
    cartLinesAdd: { cart: ShopifyCartResponse };
  }>(ADD_TO_CART_MUTATION, { cartId, lines });

  return parseCartResponse(data.cartLinesAdd.cart);
}

/**
 * Get cart contents by ID
 */
export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  try {
    const data = await shopifyGraphQLRequest<{
      cart: ShopifyCartResponse | null;
    }>(GET_CART_QUERY, { cartId });

    if (!data.cart) return null;
    return parseCartResponse(data.cart);
  } catch (error) {
    // Cart might not exist or be expired
    console.warn('Failed to fetch cart:', error);
    return null;
  }
}

// Internal types for parsing
interface ShopifyCartResponse {
  id: string;
  checkoutUrl: string;
  createdAt: string;
  updatedAt: string;
  lines: {
    edges: Array<{
      node: ShopifyCartLine;
    }>;
  };
}

/**
 * Parse Shopify cart response into our internal format
 */
function parseCartResponse(response: ShopifyCartResponse): ShopifyCart {
  return {
    id: response.id,
    checkoutUrl: response.checkoutUrl,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
    lines: response.lines.edges.map((edge) => edge.node),
  };
}

/**
 * Check if Shopify integration is enabled
 */
export function isShopifyEnabled(): boolean {
  return isShopEnabled && !!shopifyDomain && !!storefrontToken;
}

/**
 * Get the Shopify checkout URL for a given cart ID
 * This is a direct redirect URL - no API call needed
 */
export function getCheckoutUrl(cartId: string): string {
  // The checkout URL format is standard across Shopify stores
  return `https://${shopifyDomain}/checkouts/${cartId.split('/').pop()}`;
}
