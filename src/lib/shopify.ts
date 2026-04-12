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

// Admin API (for inventory sync, webhooks, etc.)
const adminAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const shopifyAdminEndpoint = shopifyDomain
  ? `https://${shopifyDomain}/admin/api/2024-01/graphql.json`
  : '';

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

/**
 * Admin API GraphQL request helper (for inventory sync, orders, etc.)
 */
async function shopifyAdminGraphQLRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!shopifyDomain || !adminAccessToken) {
    throw new Error('Shopify Admin API not configured. Set SHOPIFY_ADMIN_ACCESS_TOKEN');
  }

  const response = await fetch(shopifyAdminEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminAccessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify Admin API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`Shopify Admin GraphQL errors: ${JSON.stringify(result.errors)}`);
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
      buyerIdentity {
        email
      }
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

/**
 * Update lines in an existing cart
 * Takes: cartId and lines array with id and quantity
 */
const CART_LINES_UPDATE_MUTATION = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
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
 * Remove lines from an existing cart
 * Takes: cartId and lineIds array
 */
const CART_LINES_REMOVE_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
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
 * Update cart buyer identity (customer email)
 * Takes: cartId and buyerIdentity input with email
 */
const CART_BUYER_IDENTITY_UPDATE_MUTATION = `
  mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart {
        id
        checkoutUrl
        buyerIdentity {
          email
          phone
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

export interface ShopifyCartLineUpdateInput {
  id: string;
  quantity: number;
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

/**
 * Update lines in an existing cart
 * @param cartId - The Shopify cart ID
 * @param lines - Array of line IDs and updated quantities
 */
export async function cartLinesUpdate(
  cartId: string,
  lines: ShopifyCartLineUpdateInput[]
): Promise<ShopifyCart> {
  const data = await shopifyGraphQLRequest<{
    cartLinesUpdate: { cart: ShopifyCartResponse };
  }>(CART_LINES_UPDATE_MUTATION, { cartId, lines });

  return parseCartResponse(data.cartLinesUpdate.cart);
}

/**
 * Remove lines from an existing cart
 * @param cartId - The Shopify cart ID
 * @param lineIds - Array of line IDs to remove
 */
export async function cartLinesRemove(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart> {
  const data = await shopifyGraphQLRequest<{
    cartLinesRemove: { cart: ShopifyCartResponse };
  }>(CART_LINES_REMOVE_MUTATION, { cartId, lineIds });

  return parseCartResponse(data.cartLinesRemove.cart);
}

/**
 * Update cart buyer identity (customer email)
 * @param cartId - The Shopify cart ID
 * @param email - Customer email
 */
export async function cartBuyerIdentityUpdate(
  cartId: string,
  email: string
): Promise<{ id: string; checkoutUrl: string }> {
  const data = await shopifyGraphQLRequest<{
    cartBuyerIdentityUpdate: {
      cart: { id: string; checkoutUrl: string };
    };
  }>(CART_BUYER_IDENTITY_UPDATE_MUTATION, {
    cartId,
    buyerIdentity: { email },
  });

  return {
    id: data.cartBuyerIdentityUpdate.cart.id,
    checkoutUrl: data.cartBuyerIdentityUpdate.cart.checkoutUrl,
  };
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

// ============================================================
// Admin API Functions (for inventory sync, etc.)
// ============================================================

/**
 * Query Shopify for product/variant inventory levels
 * Used by admin inventory sync endpoint
 */
const INVENTORY_QUERY = `
  query getInventory($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          variants(first: 20) {
            edges {
              node {
                id
                title
                inventoryQuantity
                availableForSale
              }
            }
          }
        }
      }
    }
  }
`;

export interface InventoryItem {
  productId: string;
  productTitle: string;
  variantId: string;
  variantTitle: string;
  inventoryQuantity: number;
  availableForSale: boolean;
}

/**
 * Fetch inventory levels from Shopify Admin API
 * @param first - Number of products to fetch (default 50)
 */
export async function getInventoryLevels(first: number = 50): Promise<InventoryItem[]> {
  const data = await shopifyAdminGraphQLRequest<{
    products: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          variants: {
            edges: Array<{
              node: {
                id: string;
                title: string;
                inventoryQuantity: number;
                availableForSale: boolean;
              };
            }>;
          };
        };
      }>;
    };
  }>(INVENTORY_QUERY, { first });

  const items: InventoryItem[] = [];

  for (const productEdge of data.products.edges) {
    const product = productEdge.node;
    for (const variantEdge of product.variants.edges) {
      const variant = variantEdge.node;
      items.push({
        productId: product.id,
        productTitle: product.title,
        variantId: variant.id,
        variantTitle: variant.title,
        inventoryQuantity: variant.inventoryQuantity,
        availableForSale: variant.availableForSale,
      });
    }
  }

  return items;
}
