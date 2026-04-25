/**
 * Centralized shop imagery paths.
 *
 * Images live at `public/images/shop/<name>.jpg`.
 *
 * Aesthetic: bright, saturated, modern editorial (Connecting Threads style).
 */
export const SHOP_IMAGERY = {
  // Fat quarters flat-lay on white marble — hero / fabric-by-yard
  fabricByYard: '/images/shop/fabric-by-yard.jpg',

  // Two quilters laughing at a bright workshop table — community / featured store
  featuredStore: '/images/shop/featured-store.jpg',

  // Modern quilt block on white background — fresh arrivals
  fabricShopShelves: '/images/shop/fabric-shop-shelves.jpg',

  // Modern geometric quilt on white chair — essential solids / collection
  fabricCollection: '/images/shop/fabric-collection.jpg',

  // White tray of bright fat quarters with styling props — precuts / charm packs
  charmPacks: '/images/shop/charm-packs.jpg',

  // Dense rainbow thread spools — thread & bobbins
  quiltingThread: '/images/shop/quilting-thread.jpg',

  // Vivid quilt squares on cutting mat — notions / jelly rolls
  jellyRolls: '/images/shop/jelly-rolls.jpg',

  // Modern white sewing machine on marble — optional / design studio
  sewingMachine: '/images/shop/sewing-machine.jpg',
} as const;

export type ShopImageKey = keyof typeof SHOP_IMAGERY;
