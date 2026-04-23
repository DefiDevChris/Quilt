/**
 * Centralized shop imagery URLs.
 *
 * Hosted on pub.hyperagent.com (public CDN). To self-host, download these
 * files and replace with paths like '/images/shop/<name>.jpg' after adding
 * the files to public/images/shop/.
 *
 * Aesthetic: bright, saturated, modern editorial (Connecting Threads style).
 */
export const SHOP_IMAGERY = {
  // Fat quarters flat-lay on white marble — hero / fabric-by-yard
  fabricByYard:
    'https://pub.hyperagent.com/api/published/IwTf7W6f3nH-HnoLWY0K8w/fabric-by-yard.jpg',

  // Two quilters laughing at a bright workshop table — community / featured store
  featuredStore:
    'https://pub.hyperagent.com/api/published/Vd9j4_H_htNdazweJ1s2ww/featured-store.jpg',

  // Modern quilt block on white background — fresh arrivals
  fabricShopShelves:
    'https://pub.hyperagent.com/api/published/4ctab3au8R-GenX2xlAqgA/fabric-shop-shelves.jpg',

  // Modern geometric quilt on white chair — essential solids / collection
  fabricCollection:
    'https://pub.hyperagent.com/api/published/RIgyKDTRUAqrOJCsbEvCXQ/fabric-collection.jpg',

  // White tray of bright fat quarters with styling props — precuts / charm packs
  charmPacks:
    'https://pub.hyperagent.com/api/published/5uCPwF1nle7mu3OzRwp-iQ/charm-packs.jpg',

  // Dense rainbow thread spools — thread & bobbins
  quiltingThread:
    'https://pub.hyperagent.com/api/published/lntU9-SFmaiI7--JzrRPBA/quilting-thread.jpg',

  // Vivid quilt squares on cutting mat — notions / jelly rolls
  jellyRolls:
    'https://pub.hyperagent.com/api/published/6F4E3Ld0fp8ctnKDfIGFUA/jelly-rolls.jpg',

  // Modern white sewing machine on marble — optional / design studio
  sewingMachine:
    'https://pub.hyperagent.com/api/published/fKAF1JNuwG_afJgFppR3ww/sewing-machine.jpg',
} as const;

export type ShopImageKey = keyof typeof SHOP_IMAGERY;
