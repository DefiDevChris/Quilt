/**
 * Fabric Library Definitions
 *
 * Pre-loaded system fabrics organized by manufacturer, collection, and color family.
 * These represent common quilting fabrics from well-known manufacturers.
 */

export interface FabricDefinition {
  name: string;
  manufacturer: string;
  sku: string;
  collection: string;
  colorFamily: string;
}

/**
 * Generate Kona Cotton Solids by Robert Kaufman.
 * One of the most popular solid fabric lines in quilting.
 */
function generateKonaCottonSolids(): FabricDefinition[] {
  const colors: Array<{ name: string; sku: string; colorFamily: string }> = [
    { name: 'White', sku: 'K001-1387', colorFamily: 'White' },
    { name: 'Snow', sku: 'K001-1339', colorFamily: 'White' },
    { name: 'Ivory', sku: 'K001-1181', colorFamily: 'Neutral' },
    { name: 'Bone', sku: 'K001-1037', colorFamily: 'Neutral' },
    { name: 'Natural', sku: 'K001-1242', colorFamily: 'Neutral' },
    { name: 'Cream', sku: 'K001-1080', colorFamily: 'Neutral' },
    { name: 'Butter', sku: 'K001-1056', colorFamily: 'Yellow' },
    { name: 'Canary', sku: 'K001-1062', colorFamily: 'Yellow' },
    { name: 'Corn Yellow', sku: 'K001-1089', colorFamily: 'Yellow' },
    { name: 'Sunflower', sku: 'K001-1369', colorFamily: 'Yellow' },
    { name: 'School Bus', sku: 'K001-1318', colorFamily: 'Yellow' },
    { name: 'Goldfinch', sku: 'K001-0474', colorFamily: 'Yellow' },
    { name: 'Gold', sku: 'K001-1154', colorFamily: 'Yellow' },
    { name: 'Saffron', sku: 'K001-1320', colorFamily: 'Orange' },
    { name: 'Orange', sku: 'K001-1265', colorFamily: 'Orange' },
    { name: 'Tangerine', sku: 'K001-1370', colorFamily: 'Orange' },
    { name: 'Terracotta', sku: 'K001-1373', colorFamily: 'Orange' },
    { name: 'Coral', sku: 'K001-1087', colorFamily: 'Orange' },
    { name: 'Tomato', sku: 'K001-1295', colorFamily: 'Red' },
    { name: 'Red', sku: 'K001-1308', colorFamily: 'Red' },
    { name: 'Rich Red', sku: 'K001-1551', colorFamily: 'Red' },
    { name: 'Crimson', sku: 'K001-1091', colorFamily: 'Red' },
    { name: 'Ruby', sku: 'K001-1309', colorFamily: 'Red' },
    { name: 'Pomegranate', sku: 'K001-1294', colorFamily: 'Red' },
    { name: 'Wine', sku: 'K001-1390', colorFamily: 'Red' },
    { name: 'Blossom', sku: 'K001-1028', colorFamily: 'Pink' },
    { name: 'Baby Pink', sku: 'K001-189', colorFamily: 'Pink' },
    { name: 'Pink', sku: 'K001-1291', colorFamily: 'Pink' },
    { name: 'Carnation', sku: 'K001-1066', colorFamily: 'Pink' },
    { name: 'Bright Pink', sku: 'K001-1049', colorFamily: 'Pink' },
    { name: 'Hot Pink', sku: 'K001-1163', colorFamily: 'Pink' },
    { name: 'Magenta', sku: 'K001-1214', colorFamily: 'Pink' },
    { name: 'Berry', sku: 'K001-1016', colorFamily: 'Pink' },
    { name: 'Geranium', sku: 'K001-1139', colorFamily: 'Pink' },
    { name: 'Lilac', sku: 'K001-1191', colorFamily: 'Purple' },
    { name: 'Lavender', sku: 'K001-1189', colorFamily: 'Purple' },
    { name: 'Wisteria', sku: 'K001-1392', colorFamily: 'Purple' },
    { name: 'Amethyst', sku: 'K001-1003', colorFamily: 'Purple' },
    { name: 'Purple', sku: 'K001-1301', colorFamily: 'Purple' },
    { name: 'Eggplant', sku: 'K001-1133', colorFamily: 'Purple' },
    { name: 'Deep Purple', sku: 'K001-1541', colorFamily: 'Purple' },
    { name: 'Light Blue', sku: 'K001-1192', colorFamily: 'Blue' },
    { name: 'Baby Blue', sku: 'K001-1010', colorFamily: 'Blue' },
    { name: 'Lake', sku: 'K001-1185', colorFamily: 'Blue' },
    { name: 'Cornflower', sku: 'K001-1524', colorFamily: 'Blue' },
    { name: 'Periwinkle', sku: 'K001-1285', colorFamily: 'Blue' },
    { name: 'Blueprint', sku: 'K001-0848', colorFamily: 'Blue' },
    { name: 'Royal', sku: 'K001-1314', colorFamily: 'Blue' },
    { name: 'Regatta', sku: 'K001-0862', colorFamily: 'Blue' },
    { name: 'Pacific', sku: 'K001-1283', colorFamily: 'Blue' },
    { name: 'Celestial', sku: 'K001-1068', colorFamily: 'Blue' },
    { name: 'Windsor', sku: 'K001-1389', colorFamily: 'Blue' },
    { name: 'Navy', sku: 'K001-1243', colorFamily: 'Blue' },
    { name: 'Indigo', sku: 'K001-1178', colorFamily: 'Blue' },
    { name: 'Midnight', sku: 'K001-1232', colorFamily: 'Blue' },
    { name: 'Aqua', sku: 'K001-1005', colorFamily: 'Blue' },
    { name: 'Pool', sku: 'K001-1296', colorFamily: 'Blue' },
    { name: 'Teal Blue', sku: 'K001-1372', colorFamily: 'Blue' },
    { name: 'Jade Green', sku: 'K001-1183', colorFamily: 'Green' },
    { name: 'Fern', sku: 'K001-1141', colorFamily: 'Green' },
    { name: 'Kelly', sku: 'K001-1187', colorFamily: 'Green' },
    { name: 'Grass Green', sku: 'K001-1703', colorFamily: 'Green' },
    { name: 'Peridot', sku: 'K001-1289', colorFamily: 'Green' },
    { name: 'Lime', sku: 'K001-0351', colorFamily: 'Green' },
    { name: 'Chartreuse', sku: 'K001-1072', colorFamily: 'Green' },
    { name: 'Kiwi', sku: 'K001-1188', colorFamily: 'Green' },
    { name: 'Sage', sku: 'K001-1321', colorFamily: 'Green' },
    { name: 'Olive', sku: 'K001-1263', colorFamily: 'Green' },
    { name: 'Oregano', sku: 'K001-1267', colorFamily: 'Green' },
    { name: 'Hunter', sku: 'K001-1171', colorFamily: 'Green' },
    { name: 'Evergreen', sku: 'K001-1137', colorFamily: 'Green' },
    { name: 'Spruce', sku: 'K001-1361', colorFamily: 'Green' },
    { name: 'Tan', sku: 'K001-1371', colorFamily: 'Brown' },
    { name: 'Wheat', sku: 'K001-1386', colorFamily: 'Brown' },
    { name: 'Camel', sku: 'K001-1058', colorFamily: 'Brown' },
    { name: 'Sienna', sku: 'K001-1332', colorFamily: 'Brown' },
    { name: 'Mocha', sku: 'K001-1237', colorFamily: 'Brown' },
    { name: 'Coffee', sku: 'K001-1083', colorFamily: 'Brown' },
    { name: 'Chestnut', sku: 'K001-1073', colorFamily: 'Brown' },
    { name: 'Chocolate', sku: 'K001-1078', colorFamily: 'Brown' },
    { name: 'Ash', sku: 'K001-1007', colorFamily: 'Gray' },
    { name: 'Silver', sku: 'K001-1333', colorFamily: 'Gray' },
    { name: 'Medium Gray', sku: 'K001-1223', colorFamily: 'Gray' },
    { name: 'Pewter', sku: 'K001-1290', colorFamily: 'Gray' },
    { name: 'Iron', sku: 'K001-1172', colorFamily: 'Gray' },
    { name: 'Charcoal', sku: 'K001-1071', colorFamily: 'Gray' },
    { name: 'Coal', sku: 'K001-1082', colorFamily: 'Gray' },
    { name: 'Black', sku: 'K001-1019', colorFamily: 'Black' },
  ];

  return colors.map((c) => ({
    name: `Kona Cotton - ${c.name}`,
    manufacturer: 'Robert Kaufman',
    sku: c.sku,
    collection: 'Kona Cotton Solids',
    colorFamily: c.colorFamily,
  }));
}

/**
 * Generate Bella Solids by Moda Fabrics.
 */
function generateBellaSolids(): FabricDefinition[] {
  const colors: Array<{ name: string; sku: string; colorFamily: string }> = [
    { name: 'White', sku: '9900-98', colorFamily: 'White' },
    { name: 'Off White', sku: '9900-200', colorFamily: 'White' },
    { name: 'Porcelain', sku: '9900-182', colorFamily: 'Neutral' },
    { name: 'Egg Shell', sku: '9900-281', colorFamily: 'Neutral' },
    { name: 'Snow', sku: '9900-11', colorFamily: 'White' },
    { name: 'Yellow', sku: '9900-24', colorFamily: 'Yellow' },
    { name: 'Buttercup', sku: '9900-51', colorFamily: 'Yellow' },
    { name: 'Cheddar', sku: '9900-152', colorFamily: 'Orange' },
    { name: 'Orange', sku: '9900-80', colorFamily: 'Orange' },
    { name: 'Clementine', sku: '9900-209', colorFamily: 'Orange' },
    { name: 'Red', sku: '9900-16', colorFamily: 'Red' },
    { name: 'Scarlet', sku: '9900-47', colorFamily: 'Red' },
    { name: 'Christmas Red', sku: '9900-230', colorFamily: 'Red' },
    { name: 'Berry', sku: '9900-215', colorFamily: 'Red' },
    { name: 'Pink', sku: '9900-61', colorFamily: 'Pink' },
    { name: 'Peony', sku: '9900-91', colorFamily: 'Pink' },
    { name: 'Mimi Pink', sku: '9900-290', colorFamily: 'Pink' },
    { name: 'Hyacinth', sku: '9900-93', colorFamily: 'Purple' },
    { name: 'Purple', sku: '9900-21', colorFamily: 'Purple' },
    { name: 'Amelia Purple', sku: '9900-165', colorFamily: 'Purple' },
    { name: 'Robin Egg', sku: '9900-85', colorFamily: 'Blue' },
    { name: 'Blue', sku: '9900-115', colorFamily: 'Blue' },
    { name: 'Horizon Blue', sku: '9900-111', colorFamily: 'Blue' },
    { name: 'Royal', sku: '9900-19', colorFamily: 'Blue' },
    { name: 'Admiral Blue', sku: '9900-48', colorFamily: 'Blue' },
    { name: 'Navy', sku: '9900-20', colorFamily: 'Blue' },
    { name: 'Aqua', sku: '9900-34', colorFamily: 'Blue' },
    { name: 'Teal', sku: '9900-110', colorFamily: 'Blue' },
    { name: 'Pistachio', sku: '9900-134', colorFamily: 'Green' },
    { name: 'Grass', sku: '9900-101', colorFamily: 'Green' },
    { name: 'Kelly Green', sku: '9900-76', colorFamily: 'Green' },
    { name: 'Pine', sku: '9900-43', colorFamily: 'Green' },
    { name: 'Sage', sku: '9900-240', colorFamily: 'Green' },
    { name: 'Olive', sku: '9900-69', colorFamily: 'Green' },
    { name: 'Tan', sku: '9900-13', colorFamily: 'Brown' },
    { name: 'Mocha', sku: '9900-139', colorFamily: 'Brown' },
    { name: 'Chocolate', sku: '9900-41', colorFamily: 'Brown' },
    { name: 'Silver', sku: '9900-183', colorFamily: 'Gray' },
    { name: 'Graphite', sku: '9900-202', colorFamily: 'Gray' },
    { name: 'Lead', sku: '9900-283', colorFamily: 'Gray' },
    { name: 'Black', sku: '9900-99', colorFamily: 'Black' },
  ];

  return colors.map((c) => ({
    name: `Bella Solids - ${c.name}`,
    manufacturer: 'Moda Fabrics',
    sku: c.sku,
    collection: 'Bella Solids',
    colorFamily: c.colorFamily,
  }));
}

/**
 * Generate additional manufacturer collections.
 */
function generateAdditionalFabrics(): FabricDefinition[] {
  const fabrics: FabricDefinition[] = [];

  // FreeSpirit Designer Solids
  const freeSpiritColors = [
    'True White',
    'Ivory',
    'Lemon',
    'Tangerine',
    'Fire Engine Red',
    'Bubblegum',
    'Orchid',
    'Sky Blue',
    'Ocean',
    'Leaf Green',
    'Espresso',
    'Pewter',
    'Raven',
  ];
  const freeSpiritFamilies = [
    'White',
    'Neutral',
    'Yellow',
    'Orange',
    'Red',
    'Pink',
    'Purple',
    'Blue',
    'Blue',
    'Green',
    'Brown',
    'Gray',
    'Black',
  ];
  freeSpiritColors.forEach((name, i) => {
    fabrics.push({
      name: `Designer Solids - ${name}`,
      manufacturer: 'FreeSpirit',
      sku: `CSFSESS.${name.toUpperCase().replace(/\s/g, '')}`,
      collection: 'Designer Solids',
      colorFamily: freeSpiritFamilies[i],
    });
  });

  // Riley Blake Confetti Cottons
  const rileyBlakeColors = [
    'White',
    'Cream',
    'Daisy',
    'Pumpkin',
    'Barn Red',
    'Peony',
    'Violet',
    'Blueberry',
    'Denim',
    'Clover',
    'Olive',
    'Sienna',
    'Steel',
    'Jet Black',
  ];
  const rileyBlakeFamilies = [
    'White',
    'Neutral',
    'Yellow',
    'Orange',
    'Red',
    'Pink',
    'Purple',
    'Blue',
    'Blue',
    'Green',
    'Green',
    'Brown',
    'Gray',
    'Black',
  ];
  rileyBlakeColors.forEach((name, i) => {
    fabrics.push({
      name: `Confetti Cottons - ${name}`,
      manufacturer: 'Riley Blake',
      sku: `C120-${name.toUpperCase().replace(/\s/g, '')}`,
      collection: 'Confetti Cottons',
      colorFamily: rileyBlakeFamilies[i],
    });
  });

  // Art Gallery Pure Solids
  const artGalleryColors = [
    'Bright White',
    'Oat',
    'Sunshine',
    'Autumn',
    'Scarlet',
    'Fuchsia',
    'Grape',
    'Sapphire',
    'Marine',
    'Emerald',
    'Walnut',
    'Elephant',
    'Panther',
  ];
  const artGalleryFamilies = [
    'White',
    'Neutral',
    'Yellow',
    'Orange',
    'Red',
    'Pink',
    'Purple',
    'Blue',
    'Blue',
    'Green',
    'Brown',
    'Gray',
    'Black',
  ];
  artGalleryColors.forEach((name, i) => {
    fabrics.push({
      name: `Pure Solids - ${name}`,
      manufacturer: 'Art Gallery Fabrics',
      sku: `PE-${(400 + i).toString()}`,
      collection: 'Pure Solids',
      colorFamily: artGalleryFamilies[i],
    });
  });

  return fabrics;
}

export function getAllFabricDefinitions(): FabricDefinition[] {
  return [...generateKonaCottonSolids(), ...generateBellaSolids(), ...generateAdditionalFabrics()];
}
