/**
 * Pictorial quilt block generator.
 * Generates 80+ geometrically simplified pictorial blocks
 * using basic SVG primitives (rect, polygon, circle, path).
 */

import type { BlockDefinition } from '../blockDefinitions';
import {
  svgWrap,
  rect,
  polygon,
  circle,
  path,
  regularPolygonPoints,
  block,
  hst,
  diamond,
  PALETTES,
} from './utils';

// ---------------------------------------------------------------------------
// Houses (10)
// ---------------------------------------------------------------------------
function generateHouses(): BlockDefinition[] {
  const houses: BlockDefinition[] = [];

  // 1. Classic Schoolhouse
  houses.push(
    block(
      'Schoolhouse',
      'Pictorial',
      rect(15, 40, 70, 55, PALETTES.warm.primary) +
        polygon('15,40 50,10 85,40', PALETTES.warm.secondary) +
        rect(40, 60, 20, 35, PALETTES.warm.accent) +
        rect(22, 50, 12, 12, PALETTES.cool.bg) +
        rect(66, 50, 12, 12, PALETTES.cool.bg) +
        rect(46, 15, 8, 15, PALETTES.warm.bg),
      ['house', 'schoolhouse', 'building', 'pictorial'],
      'Houses'
    )
  );

  // 2. Barn
  houses.push(
    block(
      'Barn',
      'Pictorial',
      rect(10, 45, 80, 50, PALETTES.autumn.primary) +
        polygon('10,45 50,15 90,45', PALETTES.autumn.secondary) +
        rect(35, 60, 30, 35, PALETTES.earth.primary) +
        path('M 35 60 L 50 50 L 65 60', PALETTES.autumn.bg) +
        rect(20, 55, 10, 10, PALETTES.cool.bg) +
        rect(70, 55, 10, 10, PALETTES.cool.bg),
      ['barn', 'house', 'farm', 'pictorial'],
      'Houses'
    )
  );

  // 3. Log Cabin
  houses.push(
    block(
      'Log Cabin House',
      'Pictorial',
      rect(20, 40, 60, 55, PALETTES.earth.primary) +
        polygon('20,40 50,15 80,40', PALETTES.earth.secondary) +
        rect(40, 65, 20, 30, PALETTES.earth.accent) +
        rect(25, 50, 12, 10, PALETTES.cool.bg) +
        rect(63, 50, 12, 10, PALETTES.cool.bg) +
        rect(25, 42, 50, 3, PALETTES.earth.accent) +
        rect(25, 47, 50, 3, PALETTES.earth.accent),
      ['cabin', 'house', 'log', 'pictorial'],
      'Houses'
    )
  );

  // 4. Cottage
  houses.push(
    block(
      'Cottage',
      'Pictorial',
      rect(15, 50, 70, 45, PALETTES.spring.primary) +
        polygon('10,50 50,20 90,50', PALETTES.spring.secondary) +
        rect(42, 68, 16, 27, PALETTES.earth.primary) +
        rect(20, 58, 15, 12, PALETTES.cool.bg) +
        rect(65, 58, 15, 12, PALETTES.cool.bg) +
        circle(70, 35, 5, PALETTES.spring.accent),
      ['cottage', 'house', 'garden', 'pictorial'],
      'Houses'
    )
  );

  // 5. Row House
  houses.push(
    block(
      'Row House',
      'Pictorial',
      rect(5, 30, 28, 65, PALETTES.warm.primary) +
        polygon('5,30 19,15 33,30', PALETTES.warm.secondary) +
        rect(36, 30, 28, 65, PALETTES.cool.primary) +
        polygon('36,30 50,15 64,30', PALETTES.cool.secondary) +
        rect(67, 30, 28, 65, PALETTES.jewel.primary) +
        polygon('67,30 81,15 95,30', PALETTES.jewel.secondary) +
        rect(14, 60, 10, 35, PALETTES.warm.bg) +
        rect(45, 60, 10, 35, PALETTES.cool.bg) +
        rect(76, 60, 10, 35, PALETTES.jewel.bg),
      ['row house', 'townhouse', 'city', 'pictorial'],
      'Houses'
    )
  );

  // 6. Church
  houses.push(
    block(
      'Church',
      'Pictorial',
      rect(20, 45, 60, 50, PALETTES.neutral.bg) +
        polygon('20,45 50,20 80,45', PALETTES.cool.primary) +
        rect(45, 20, 10, 20, PALETTES.neutral.primary) +
        polygon('45,5 50,0 55,5 55,20 45,20', PALETTES.neutral.primary) +
        rect(40, 60, 20, 35, PALETTES.earth.primary) +
        path('M 40 60 A 10 10 0 0 1 60 60', PALETTES.cool.accent) +
        rect(25, 55, 10, 15, PALETTES.cool.bg) +
        rect(65, 55, 10, 15, PALETTES.cool.bg),
      ['church', 'steeple', 'building', 'pictorial'],
      'Houses'
    )
  );

  // 7. Victorian House
  houses.push(
    block(
      'Victorian House',
      'Pictorial',
      rect(15, 45, 70, 50, PALETTES.jewel.primary) +
        polygon('15,45 50,15 85,45', PALETTES.jewel.secondary) +
        rect(60, 10, 15, 35, PALETTES.jewel.accent) +
        polygon('58,10 67,2 76,10', PALETTES.jewel.bg) +
        rect(42, 65, 16, 30, PALETTES.earth.primary) +
        rect(20, 55, 12, 12, PALETTES.cool.bg) +
        rect(68, 55, 12, 12, PALETTES.cool.bg) +
        circle(50, 30, 6, PALETTES.jewel.bg),
      ['victorian', 'house', 'fancy', 'pictorial'],
      'Houses'
    )
  );

  // 8. A-Frame Cabin
  houses.push(
    block(
      'A-Frame Cabin',
      'Pictorial',
      polygon('10,95 50,10 90,95', PALETTES.earth.secondary) +
        polygon('20,95 50,25 80,95', PALETTES.earth.primary) +
        rect(40, 65, 20, 30, PALETTES.earth.accent) +
        rect(30, 50, 10, 10, PALETTES.cool.bg) +
        rect(60, 50, 10, 10, PALETTES.cool.bg),
      ['a-frame', 'cabin', 'house', 'pictorial'],
      'Houses'
    )
  );

  // 9. Farmhouse
  houses.push(
    block(
      'Farmhouse',
      'Pictorial',
      rect(5, 50, 55, 45, PALETTES.neutral.bg) +
        polygon('5,50 32,25 60,50', PALETTES.autumn.primary) +
        rect(60, 55, 35, 40, PALETTES.autumn.primary) +
        polygon('60,55 77,40 95,55', PALETTES.autumn.secondary) +
        rect(22, 65, 16, 30, PALETTES.earth.primary) +
        rect(12, 60, 10, 10, PALETTES.cool.bg) +
        rect(68, 65, 10, 10, PALETTES.cool.bg),
      ['farmhouse', 'house', 'country', 'pictorial'],
      'Houses'
    )
  );

  // 10. Lighthouse
  houses.push(
    block(
      'Lighthouse',
      'Pictorial',
      polygon('35,95 40,30 60,30 65,95', PALETTES.autumn.primary) +
        rect(38, 30, 24, 8, PALETTES.cool.bg) +
        polygon('35,30 50,12 65,30', PALETTES.neutral.primary) +
        circle(50, 20, 5, PALETTES.warm.accent) +
        rect(42, 50, 16, 5, PALETTES.neutral.bg) +
        rect(42, 65, 16, 5, PALETTES.neutral.bg) +
        rect(42, 80, 16, 5, PALETTES.neutral.bg),
      ['lighthouse', 'tower', 'coastal', 'pictorial'],
      'Houses'
    )
  );

  return houses;
}

// ---------------------------------------------------------------------------
// Hearts (10)
// ---------------------------------------------------------------------------
function generateHearts(): BlockDefinition[] {
  const hearts: BlockDefinition[] = [];
  const colorPairs: Array<{ fill: string; bg: string; label: string }> = [
    { fill: '#E53935', bg: '#FFEBEE', label: 'Red' },
    { fill: '#E91E63', bg: '#FCE4EC', label: 'Pink' },
    { fill: '#9C27B0', bg: '#F3E5F5', label: 'Purple' },
    { fill: '#D84315', bg: '#FBE9E7', label: 'Rust' },
    { fill: '#C62828', bg: '#FFF8E1', label: 'Crimson' },
    { fill: '#AD1457', bg: '#FFF3E0', label: 'Magenta' },
    { fill: '#6A1B9A', bg: '#EDE7F6', label: 'Violet' },
    { fill: '#BF360C', bg: '#EFEBE9', label: 'Burnt Orange' },
    { fill: '#880E4F', bg: '#F8BBD0', label: 'Rose' },
    { fill: '#B71C1C', bg: '#F5F5F5', label: 'Dark Red' },
  ];

  colorPairs.forEach(({ fill, bg, label }) => {
    const svg =
      // Background
      rect(0, 0, 100, 100, bg) +
      // Heart from pieced HSTs and squares
      // Top row: two bumps
      hst(20, 20, 20, 20, fill, bg) +
      rect(40, 20, 20, 20, fill) +
      hst(60, 20, 20, 20, bg, fill) +
      // Second row
      hst(10, 30, 20, 20, fill, bg) +
      rect(30, 30, 40, 20, fill) +
      hst(70, 30, 20, 20, bg, fill) +
      // Third row
      rect(20, 40, 60, 15, fill) +
      // Fourth row: narrowing
      hst(25, 55, 15, 15, bg, fill) +
      rect(40, 55, 20, 15, fill) +
      hst(60, 55, 15, 15, fill, bg) +
      // Point
      hst(35, 70, 15, 15, bg, fill) +
      hst(50, 70, 15, 15, fill, bg);

    hearts.push(
      block(
        `Pieced Heart - ${label}`,
        'Pictorial',
        svg,
        ['heart', 'love', 'pieced', 'pictorial'],
        'Hearts'
      )
    );
  });

  return hearts;
}

// ---------------------------------------------------------------------------
// Trees (10)
// ---------------------------------------------------------------------------
function generateTrees(): BlockDefinition[] {
  const trees: BlockDefinition[] = [];

  // 1. Pine Tree
  trees.push(
    block(
      'Pine Tree',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.cool.bg) +
        polygon('50,5 20,40 80,40', '#2E7D32') +
        polygon('50,25 15,65 85,65', '#388E3C') +
        polygon('50,45 10,90 90,90', '#43A047') +
        rect(43, 85, 14, 15, PALETTES.earth.primary),
      ['pine', 'tree', 'evergreen', 'pictorial'],
      'Trees'
    )
  );

  // 2. Maple Leaf
  trees.push(
    block(
      'Maple Leaf',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.autumn.bg) +
        polygon(
          '50,5 60,30 90,25 70,45 85,75 55,60 50,90 45,60 15,75 30,45 10,25 40,30',
          PALETTES.autumn.primary
        ) +
        rect(47, 75, 6, 20, PALETTES.earth.primary),
      ['maple', 'leaf', 'autumn', 'pictorial'],
      'Trees'
    )
  );

  // 3. Tree of Life
  trees.push(
    block(
      'Tree of Life',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        rect(45, 50, 10, 45, PALETTES.earth.primary) +
        circle(50, 35, 30, PALETTES.spring.primary) +
        circle(35, 25, 15, PALETTES.spring.secondary) +
        circle(65, 25, 15, PALETTES.spring.secondary) +
        circle(50, 15, 12, PALETTES.spring.primary) +
        path('M 45 65 Q 30 55 20 70', PALETTES.earth.secondary) +
        path('M 55 65 Q 70 55 80 70', PALETTES.earth.secondary),
      ['tree of life', 'tree', 'nature', 'pictorial'],
      'Trees'
    )
  );

  // 4. Oak Tree
  trees.push(
    block(
      'Oak Tree',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.cool.bg) +
        rect(42, 55, 16, 40, PALETTES.earth.secondary) +
        circle(50, 35, 28, '#2E7D32') +
        circle(30, 40, 18, '#388E3C') +
        circle(70, 40, 18, '#388E3C') +
        circle(40, 22, 15, '#43A047') +
        circle(60, 22, 15, '#43A047'),
      ['oak', 'tree', 'nature', 'pictorial'],
      'Trees'
    )
  );

  // 5. Palm Tree
  trees.push(
    block(
      'Palm Tree',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.ocean.bg) +
        path('M 50 95 Q 48 60 45 35', PALETTES.earth.secondary) +
        path('M 45 35 Q 20 25 5 40', '#2E7D32') +
        path('M 45 35 Q 70 20 90 35', '#388E3C') +
        path('M 45 35 Q 30 10 15 15', '#43A047') +
        path('M 45 35 Q 60 8 80 12', '#2E7D32') +
        path('M 45 35 Q 45 10 50 5', '#388E3C'),
      ['palm', 'tree', 'tropical', 'pictorial'],
      'Trees'
    )
  );

  // 6. Pieced Pine
  trees.push(
    block(
      'Pieced Pine Tree',
      'Pictorial',
      rect(0, 0, 100, 100, '#F1F8E9') +
        hst(30, 10, 20, 20, '#F1F8E9', '#2E7D32') +
        hst(50, 10, 20, 20, '#2E7D32', '#F1F8E9') +
        hst(20, 30, 30, 20, '#F1F8E9', '#388E3C') +
        hst(50, 30, 30, 20, '#388E3C', '#F1F8E9') +
        hst(10, 50, 40, 25, '#F1F8E9', '#43A047') +
        hst(50, 50, 40, 25, '#43A047', '#F1F8E9') +
        rect(43, 75, 14, 20, PALETTES.earth.primary),
      ['pine', 'tree', 'pieced', 'pictorial'],
      'Trees'
    )
  );

  // 7. Birch Tree
  trees.push(
    block(
      'Birch Tree',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.cool.bg) +
        rect(43, 25, 14, 70, '#F5F5F5') +
        rect(43, 30, 14, 2, '#9E9E9E') +
        rect(43, 40, 14, 2, '#9E9E9E') +
        rect(43, 50, 14, 2, '#9E9E9E') +
        rect(43, 60, 14, 2, '#9E9E9E') +
        rect(43, 70, 14, 2, '#9E9E9E') +
        circle(50, 18, 20, '#AED581') +
        circle(35, 25, 12, '#81C784') +
        circle(65, 25, 12, '#81C784'),
      ['birch', 'tree', 'nature', 'pictorial'],
      'Trees'
    )
  );

  // 8. Autumn Tree
  trees.push(
    block(
      'Autumn Tree',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.autumn.bg) +
        rect(44, 55, 12, 40, PALETTES.earth.secondary) +
        circle(50, 35, 25, PALETTES.autumn.primary) +
        circle(32, 30, 15, PALETTES.autumn.secondary) +
        circle(68, 30, 15, '#F57C00') +
        circle(50, 18, 14, PALETTES.warm.accent),
      ['autumn', 'tree', 'fall', 'pictorial'],
      'Trees'
    )
  );

  // 9. Apple Tree
  trees.push(
    block(
      'Apple Tree',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        rect(44, 55, 12, 40, PALETTES.earth.secondary) +
        circle(50, 35, 28, '#2E7D32') +
        circle(35, 28, 5, '#E53935') +
        circle(60, 32, 5, '#E53935') +
        circle(45, 42, 5, '#E53935') +
        circle(65, 22, 5, '#E53935') +
        circle(38, 40, 4, '#E53935'),
      ['apple', 'tree', 'fruit', 'pictorial'],
      'Trees'
    )
  );

  // 10. Winter Tree
  trees.push(
    block(
      'Winter Tree',
      'Pictorial',
      rect(0, 0, 100, 100, '#E3F2FD') +
        rect(45, 40, 10, 55, '#795548') +
        path('M 50 40 L 25 55 M 50 40 L 75 55', '#795548') +
        path('M 50 30 L 20 45 M 50 30 L 80 45', '#795548') +
        path('M 50 20 L 30 30 M 50 20 L 70 30', '#795548') +
        path('M 50 12 L 35 20 M 50 12 L 65 20', '#795548') +
        circle(25, 55, 3, '#BBDEFB') +
        circle(75, 55, 3, '#BBDEFB') +
        circle(20, 45, 3, '#BBDEFB') +
        circle(80, 45, 3, '#BBDEFB'),
      ['winter', 'tree', 'bare', 'pictorial'],
      'Trees'
    )
  );

  return trees;
}

// ---------------------------------------------------------------------------
// Animals (10)
// ---------------------------------------------------------------------------
function generateAnimals(): BlockDefinition[] {
  const animals: BlockDefinition[] = [];

  // 1. Butterfly
  animals.push(
    block(
      'Butterfly',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        // Body
        rect(47, 25, 6, 50, '#5D4037') +
        // Upper wings
        path('M 47 35 Q 20 10 15 35 Q 15 55 47 50', PALETTES.jewel.primary) +
        path('M 53 35 Q 80 10 85 35 Q 85 55 53 50', PALETTES.jewel.secondary) +
        // Lower wings
        path('M 47 50 Q 20 50 20 70 Q 25 80 47 65', PALETTES.jewel.accent) +
        path('M 53 50 Q 80 50 80 70 Q 75 80 53 65', PALETTES.jewel.primary) +
        // Antennae
        path('M 48 25 Q 35 10 30 5', '#5D4037') +
        path('M 52 25 Q 65 10 70 5', '#5D4037'),
      ['butterfly', 'insect', 'animal', 'pictorial'],
      'Animals'
    )
  );

  // 2. Bird
  animals.push(
    block(
      'Bird',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.cool.bg) +
        // Body
        path('M 30 50 Q 50 30 75 45 Q 80 55 60 60 Q 40 65 30 50', PALETTES.cool.primary) +
        // Head
        circle(70, 40, 10, PALETTES.cool.secondary) +
        // Eye
        circle(73, 38, 2, '#333') +
        // Beak
        polygon('80,40 90,38 80,42', PALETTES.warm.accent) +
        // Wing
        path('M 40 48 Q 50 35 65 45', PALETTES.cool.accent) +
        // Tail
        polygon('25,48 10,35 15,55', PALETTES.cool.primary) +
        // Legs
        path('M 50 60 L 48 80 L 42 82 M 48 80 L 54 82', '#5D4037') +
        path('M 60 58 L 58 78 L 52 80 M 58 78 L 64 80', '#5D4037'),
      ['bird', 'animal', 'flying', 'pictorial'],
      'Animals'
    )
  );

  // 3. Fish
  animals.push(
    block(
      'Fish',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.ocean.bg) +
        // Body
        path('M 20 50 Q 50 25 80 50 Q 50 75 20 50', PALETTES.ocean.primary) +
        // Tail
        polygon('15,50 5,35 5,65', PALETTES.ocean.secondary) +
        // Eye
        circle(65, 47, 4, '#FFF') +
        circle(66, 46, 2, '#333') +
        // Fin
        path('M 45 38 Q 50 25 55 38', PALETTES.ocean.accent) +
        // Scales pattern
        path('M 35 45 Q 40 40 45 45', PALETTES.ocean.secondary) +
        path('M 40 55 Q 45 50 50 55', PALETTES.ocean.secondary) +
        path('M 50 45 Q 55 40 60 45', PALETTES.ocean.secondary),
      ['fish', 'animal', 'ocean', 'pictorial'],
      'Animals'
    )
  );

  // 4. Cat
  animals.push(
    block(
      'Cat',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.warm.bg) +
        // Body
        path('M 30 90 Q 25 55 40 50 Q 60 45 70 55 Q 80 65 75 90 Z', PALETTES.neutral.primary) +
        // Head
        circle(55, 38, 16, PALETTES.neutral.primary) +
        // Ears
        polygon('42,28 38,12 50,25', PALETTES.neutral.primary) +
        polygon('62,25 72,12 68,28', PALETTES.neutral.primary) +
        polygon('44,26 40,16 50,25', PALETTES.warm.accent) +
        polygon('64,25 70,16 66,27', PALETTES.warm.accent) +
        // Eyes
        circle(48, 36, 3, '#4CAF50') +
        circle(62, 36, 3, '#4CAF50') +
        circle(48, 36, 1.5, '#333') +
        circle(62, 36, 1.5, '#333') +
        // Nose
        polygon('54,42 52,45 56,45', PALETTES.warm.accent) +
        // Tail
        path('M 30 80 Q 10 60 15 40 Q 18 30 25 35', PALETTES.neutral.primary),
      ['cat', 'animal', 'pet', 'pictorial'],
      'Animals'
    )
  );

  // 5. Bear Paw
  animals.push(
    block(
      'Bear Paw',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.earth.bg) +
        // Center square
        rect(30, 30, 40, 40, PALETTES.earth.primary) +
        // Paw pads (four corner squares with HSTs)
        hst(5, 5, 25, 25, PALETTES.earth.primary, PALETTES.earth.bg) +
        hst(70, 5, 25, 25, PALETTES.earth.bg, PALETTES.earth.primary) +
        hst(5, 70, 25, 25, PALETTES.earth.bg, PALETTES.earth.primary) +
        hst(70, 70, 25, 25, PALETTES.earth.primary, PALETTES.earth.bg) +
        // Toe circles
        circle(12, 12, 6, PALETTES.earth.secondary) +
        circle(88, 12, 6, PALETTES.earth.secondary) +
        circle(12, 88, 6, PALETTES.earth.secondary) +
        circle(88, 88, 6, PALETTES.earth.secondary),
      ['bear paw', 'animal', 'traditional', 'pictorial'],
      'Animals'
    )
  );

  // 6. Dog
  animals.push(
    block(
      'Dog',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.cool.bg) +
        // Body
        path('M 20 85 Q 15 55 35 50 L 70 48 Q 85 50 80 85 Z', '#8D6E63') +
        // Head
        circle(72, 35, 15, '#8D6E63') +
        // Ear
        path('M 62 28 Q 55 15 60 30', '#5D4037') +
        path('M 82 28 Q 88 15 84 30', '#5D4037') +
        // Eye
        circle(68, 32, 3, '#FFF') +
        circle(69, 32, 1.5, '#333') +
        // Nose
        circle(80, 37, 3, '#333') +
        // Tail
        path('M 20 65 Q 5 50 10 35', '#8D6E63') +
        // Legs
        rect(28, 75, 8, 20, '#8D6E63') +
        rect(65, 75, 8, 20, '#8D6E63'),
      ['dog', 'animal', 'pet', 'pictorial'],
      'Animals'
    )
  );

  // 7. Owl
  animals.push(
    block(
      'Owl',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.cool.bg) +
        // Body
        path('M 30 90 Q 25 50 50 30 Q 75 50 70 90 Z', '#795548') +
        // Eyes
        circle(40, 45, 10, '#FFF') +
        circle(60, 45, 10, '#FFF') +
        circle(40, 45, 5, PALETTES.warm.accent) +
        circle(60, 45, 5, PALETTES.warm.accent) +
        circle(40, 45, 2, '#333') +
        circle(60, 45, 2, '#333') +
        // Beak
        polygon('50,52 46,58 54,58', PALETTES.warm.primary) +
        // Ear tufts
        polygon('30,35 25,15 38,30', '#795548') +
        polygon('70,35 75,15 62,30', '#795548') +
        // Wing lines
        path('M 32 60 Q 40 55 35 75', '#5D4037') +
        path('M 68 60 Q 60 55 65 75', '#5D4037') +
        // Feet
        path('M 42 90 L 38 97 M 42 90 L 42 97 M 42 90 L 46 97', '#795548') +
        path('M 58 90 L 54 97 M 58 90 L 58 97 M 58 90 L 62 97', '#795548'),
      ['owl', 'bird', 'animal', 'pictorial'],
      'Animals'
    )
  );

  // 8. Rabbit
  animals.push(
    block(
      'Rabbit',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        // Body
        path('M 35 90 Q 25 60 50 55 Q 75 60 65 90 Z', '#BDBDBD') +
        // Head
        circle(50, 42, 14, '#BDBDBD') +
        // Ears
        path('M 42 30 Q 38 5 35 28', '#BDBDBD') +
        path('M 58 30 Q 62 5 65 28', '#BDBDBD') +
        path('M 43 28 Q 40 10 38 27', PALETTES.warm.accent) +
        path('M 57 28 Q 60 10 62 27', PALETTES.warm.accent) +
        // Eyes
        circle(44, 40, 3, '#333') +
        circle(56, 40, 3, '#333') +
        // Nose
        circle(50, 47, 2, PALETTES.warm.accent) +
        // Tail
        circle(55, 85, 5, '#FFF'),
      ['rabbit', 'bunny', 'animal', 'pictorial'],
      'Animals'
    )
  );

  // 9. Fox
  animals.push(
    block(
      'Fox',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        // Body
        path('M 25 85 Q 20 55 45 48 L 65 46 Q 80 50 75 85 Z', '#E65100') +
        // Head
        polygon('55,20 35,45 75,45', '#E65100') +
        // White face
        polygon('55,30 45,45 65,45', '#FFF') +
        // Ears
        polygon('40,25 35,8 48,22', '#E65100') +
        polygon('68,22 75,8 70,25', '#E65100') +
        // Eyes
        circle(48, 35, 2, '#333') +
        circle(62, 35, 2, '#333') +
        // Nose
        circle(55, 42, 2, '#333') +
        // Tail
        path('M 25 70 Q 5 55 10 40 Q 15 35 20 42', '#E65100') +
        path('M 10 40 Q 14 38 16 42', '#FFF'),
      ['fox', 'animal', 'wildlife', 'pictorial'],
      'Animals'
    )
  );

  // 10. Horse
  animals.push(
    block(
      'Horse',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.warm.bg) +
        // Body
        path('M 20 85 L 15 55 Q 20 45 50 40 Q 75 42 80 55 L 85 85 Z', '#8D6E63') +
        // Neck and head
        path('M 70 45 Q 75 25 70 15 Q 65 10 60 15 L 58 25', '#8D6E63') +
        // Eye
        circle(65, 18, 2, '#333') +
        // Ear
        polygon('68,12 72,2 74,12', '#8D6E63') +
        // Mane
        path('M 70 15 Q 68 20 70 28 Q 68 32 70 38 Q 68 42 70 45', '#5D4037') +
        // Legs
        rect(22, 75, 8, 20, '#8D6E63') +
        rect(38, 78, 8, 17, '#8D6E63') +
        rect(58, 78, 8, 17, '#8D6E63') +
        rect(75, 75, 8, 20, '#8D6E63') +
        // Tail
        path('M 15 55 Q 5 50 8 65', '#5D4037'),
      ['horse', 'animal', 'farm', 'pictorial'],
      'Animals'
    )
  );

  return animals;
}

// ---------------------------------------------------------------------------
// Baskets (10)
// ---------------------------------------------------------------------------
function generateBaskets(): BlockDefinition[] {
  const baskets: BlockDefinition[] = [];

  const basketColors: Array<{ weave: string; bg: string; handle: string; label: string }> = [
    { weave: '#8B6914', bg: '#F5ECD7', handle: '#6B4423', label: 'Traditional' },
    { weave: '#D4883C', bg: '#FFF3E0', handle: '#A0522D', label: 'Warm' },
    { weave: '#4A90D9', bg: '#E8F0F5', handle: '#2E7D32', label: 'Blue' },
    { weave: '#E91E63', bg: '#FCE4EC', handle: '#AD1457', label: 'Pink' },
    { weave: '#9C27B0', bg: '#F3E5F5', handle: '#673AB7', label: 'Purple' },
    { weave: '#2E7D32', bg: '#F1F8E9', handle: '#1B5E20', label: 'Green' },
    { weave: '#D84315', bg: '#FBE9E7', handle: '#BF360C', label: 'Autumn' },
    { weave: '#0277BD', bg: '#E1F5FE', handle: '#006064', label: 'Ocean' },
    { weave: '#F57C00', bg: '#FFF8E1', handle: '#E65100', label: 'Harvest' },
    { weave: '#795548', bg: '#EFEBE9', handle: '#4E342E', label: 'Wicker' },
  ];

  basketColors.forEach(({ weave, bg, handle, label }) => {
    const svg =
      rect(0, 0, 100, 100, bg) +
      // Handle arc
      path(`M 25 50 Q 50 10 75 50`, handle) +
      path(`M 28 50 Q 50 15 72 50`, bg) +
      // Basket body - triangle shape
      polygon(`15,50 85,50 70,95 30,95`, weave) +
      // Weave pattern lines
      path(`M 30 60 L 70 60`, bg) +
      path(`M 32 70 L 68 70`, bg) +
      path(`M 35 80 L 65 80`, bg) +
      path(`M 37 90 L 63 90`, bg) +
      // Vertical weave
      path(`M 42 50 L 38 95`, bg) +
      path(`M 58 50 L 62 95`, bg) +
      path(`M 50 50 L 50 95`, bg) +
      // Basket rim
      rect(15, 48, 70, 5, handle);

    baskets.push(
      block(`Basket - ${label}`, 'Pictorial', svg, ['basket', 'container', 'pictorial'], 'Baskets')
    );
  });

  return baskets;
}

// ---------------------------------------------------------------------------
// Flowers (10)
// ---------------------------------------------------------------------------
function generateFlowers(): BlockDefinition[] {
  const flowers: BlockDefinition[] = [];

  // 1. Tulip
  flowers.push(
    block(
      'Tulip',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        // Stem
        rect(47, 45, 6, 50, '#388E3C') +
        // Leaves
        path('M 47 65 Q 25 55 20 70', '#4CAF50') +
        path('M 53 60 Q 75 50 80 65', '#4CAF50') +
        // Petals
        path('M 50 45 Q 35 30 30 15 Q 45 20 50 10', '#E91E63') +
        path('M 50 45 Q 50 25 50 10', '#C2185B') +
        path('M 50 45 Q 65 30 70 15 Q 55 20 50 10', '#F06292'),
      ['tulip', 'flower', 'spring', 'pictorial'],
      'Flowers'
    )
  );

  // 2. Sunflower
  flowers.push(
    block(
      'Sunflower',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.cool.bg) +
        // Stem
        rect(47, 55, 6, 40, '#388E3C') +
        // Leaves
        path('M 47 70 Q 25 60 15 72', '#4CAF50') +
        path('M 53 75 Q 75 65 85 77', '#4CAF50') +
        // Petals
        polygon('50,10 44,28 56,28', '#FFC107') +
        polygon('72,18 60,30 66,38', '#FFB300') +
        polygon('82,38 66,38 62,50', '#FFC107') +
        polygon('72,62 60,50 66,42', '#FFB300') +
        polygon('50,70 44,52 56,52', '#FFC107') +
        polygon('28,62 40,50 34,42', '#FFB300') +
        polygon('18,38 34,38 38,50', '#FFC107') +
        polygon('28,18 40,30 34,38', '#FFB300') +
        // Center
        circle(50, 40, 12, '#5D4037'),
      ['sunflower', 'flower', 'summer', 'pictorial'],
      'Flowers'
    )
  );

  // 3. Lily
  flowers.push(
    block(
      'Lily',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        rect(47, 50, 6, 45, '#388E3C') +
        path('M 47 65 Q 25 55 20 68', '#4CAF50') +
        path('M 50 50 Q 30 20 20 30 Q 35 35 50 50', '#FF8A65') +
        path('M 50 50 Q 70 20 80 30 Q 65 35 50 50', '#FF7043') +
        path('M 50 50 Q 40 15 50 8 Q 60 15 50 50', '#FF5722') +
        path('M 50 50 Q 25 35 18 45 Q 35 45 50 50', '#FFAB91') +
        path('M 50 50 Q 75 35 82 45 Q 65 45 50 50', '#FFAB91') +
        circle(50, 42, 3, '#FFC107'),
      ['lily', 'flower', 'garden', 'pictorial'],
      'Flowers'
    )
  );

  // 4. Rose
  flowers.push(
    block(
      'Rose',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        rect(47, 55, 6, 40, '#388E3C') +
        path('M 47 70 Q 30 60 22 72', '#4CAF50') +
        path('M 53 65 Q 70 55 78 67', '#4CAF50') +
        // Rose petals (concentric arcs)
        circle(50, 38, 22, '#E91E63') +
        path('M 35 30 Q 50 20 65 30 Q 60 40 50 38 Q 40 40 35 30', '#C2185B') +
        path('M 40 35 Q 50 28 60 35 Q 55 42 50 40 Q 45 42 40 35', '#AD1457') +
        circle(50, 36, 5, '#880E4F'),
      ['rose', 'flower', 'garden', 'pictorial'],
      'Flowers'
    )
  );

  // 5. Daisy
  flowers.push(
    block(
      'Daisy',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.cool.bg) +
        rect(47, 55, 6, 40, '#388E3C') +
        path('M 47 70 Q 30 60 22 72', '#4CAF50') +
        // Petals
        polygon('50,8 44,28 56,28', '#FFF') +
        polygon('70,14 58,30 64,38', '#FFF') +
        polygon('76,34 62,38 60,50', '#FFF') +
        polygon('70,54 58,48 56,40', '#FFF') +
        polygon('50,60 44,42 56,42', '#FFF') +
        polygon('30,54 42,48 44,40', '#FFF') +
        polygon('24,34 38,38 40,50', '#FFF') +
        polygon('30,14 42,30 36,38', '#FFF') +
        // Center
        circle(50, 35, 10, '#FFC107'),
      ['daisy', 'flower', 'simple', 'pictorial'],
      'Flowers'
    )
  );

  // 6. Morning Glory
  flowers.push(
    block(
      'Morning Glory',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        // Vine
        path('M 50 95 Q 45 70 50 55 Q 55 40 50 30', '#388E3C') +
        path('M 50 80 Q 30 75 20 82', '#4CAF50') +
        path('M 50 65 Q 70 60 80 67', '#4CAF50') +
        // Flower (trumpet shape)
        path('M 30 20 Q 50 5 70 20 Q 65 40 50 35 Q 35 40 30 20', '#7B1FA2') +
        path('M 38 22 Q 50 12 62 22 Q 58 35 50 32 Q 42 35 38 22', '#9C27B0') +
        circle(50, 25, 5, '#FFF'),
      ['morning glory', 'flower', 'vine', 'pictorial'],
      'Flowers'
    )
  );

  // 7. Daffodil
  flowers.push(
    block(
      'Daffodil',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        rect(47, 55, 6, 40, '#388E3C') +
        path('M 47 70 Q 30 60 22 72', '#4CAF50') +
        // Outer petals
        polygon('50,8 42,28 58,28', '#FFF176') +
        polygon('72,22 58,32 64,42', '#FFF176') +
        polygon('68,48 56,42 52,52', '#FFF176') +
        polygon('32,48 44,42 48,52', '#FFF176') +
        polygon('28,22 42,32 36,42', '#FFF176') +
        polygon('50,58 44,42 56,42', '#FFF176') +
        // Center trumpet
        circle(50, 38, 8, '#FF8F00') +
        circle(50, 38, 5, '#FFB300'),
      ['daffodil', 'flower', 'spring', 'pictorial'],
      'Flowers'
    )
  );

  // 8. Iris
  flowers.push(
    block(
      'Iris',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        rect(47, 50, 6, 45, '#388E3C') +
        // Upright petals
        path('M 50 50 Q 40 25 35 10 Q 50 20 50 50', '#5C6BC0') +
        path('M 50 50 Q 60 25 65 10 Q 50 20 50 50', '#7986CB') +
        path('M 50 50 Q 50 25 50 8', '#3F51B5') +
        // Falls
        path('M 50 50 Q 30 55 18 65 Q 30 60 50 50', '#9FA8DA') +
        path('M 50 50 Q 70 55 82 65 Q 70 60 50 50', '#9FA8DA') +
        // Beard
        path('M 50 50 Q 45 55 42 62', '#FFC107') +
        path('M 50 50 Q 55 55 58 62', '#FFC107'),
      ['iris', 'flower', 'garden', 'pictorial'],
      'Flowers'
    )
  );

  // 9. Pansy
  flowers.push(
    block(
      'Pansy',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        rect(47, 60, 6, 35, '#388E3C') +
        // Upper petals
        path('M 50 40 Q 30 15 25 25 Q 30 45 50 40', '#7B1FA2') +
        path('M 50 40 Q 70 15 75 25 Q 70 45 50 40', '#7B1FA2') +
        // Middle petals
        path('M 50 40 Q 20 35 15 50 Q 30 55 50 45', '#AB47BC') +
        path('M 50 40 Q 80 35 85 50 Q 70 55 50 45', '#AB47BC') +
        // Bottom petal
        path('M 50 45 Q 35 60 40 70 Q 50 65 60 70 Q 65 60 50 45', '#FFC107') +
        // Center
        circle(50, 42, 4, '#FFF') +
        // Face lines
        path('M 48 42 L 42 50', '#333') +
        path('M 52 42 L 58 50', '#333') +
        path('M 50 44 L 50 52', '#333'),
      ['pansy', 'flower', 'garden', 'pictorial'],
      'Flowers'
    )
  );

  // 10. Poppy
  flowers.push(
    block(
      'Poppy',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        rect(47, 55, 6, 40, '#388E3C') +
        path('M 47 70 Q 30 60 22 72', '#4CAF50') +
        // Petals
        path('M 50 40 Q 25 10 20 30 Q 25 50 50 40', '#E53935') +
        path('M 50 40 Q 75 10 80 30 Q 75 50 50 40', '#F44336') +
        path('M 50 40 Q 30 55 25 65 Q 40 60 50 50', '#EF5350') +
        path('M 50 40 Q 70 55 75 65 Q 60 60 50 50', '#EF5350') +
        // Center
        circle(50, 40, 7, '#333') +
        circle(50, 40, 4, '#4CAF50'),
      ['poppy', 'flower', 'garden', 'pictorial'],
      'Flowers'
    )
  );

  return flowers;
}

// ---------------------------------------------------------------------------
// Nature (10)
// ---------------------------------------------------------------------------
function generateNature(): BlockDefinition[] {
  const nature: BlockDefinition[] = [];

  // 1. Mountain
  nature.push(
    block(
      'Mountain',
      'Pictorial',
      rect(0, 0, 100, 100, '#87CEEB') +
        // Background mountain
        polygon('10,95 45,25 80,95', '#78909C') +
        // Foreground mountain
        polygon('30,95 65,15 95,95', '#607D8B') +
        // Snow cap
        polygon('65,15 58,35 72,35', '#FAFAFA') +
        // Ground
        rect(0, 88, 100, 12, '#4CAF50'),
      ['mountain', 'nature', 'landscape', 'pictorial'],
      'Nature'
    )
  );

  // 2. Sun
  nature.push(
    block(
      'Sun',
      'Pictorial',
      rect(0, 0, 100, 100, '#87CEEB') +
        // Rays
        polygon('50,5 45,25 55,25', '#FFC107') +
        polygon('50,95 45,75 55,75', '#FFC107') +
        polygon('5,50 25,45 25,55', '#FFC107') +
        polygon('95,50 75,45 75,55', '#FFC107') +
        polygon('18,18 30,30 22,34', '#FFB300') +
        polygon('82,18 70,30 78,34', '#FFB300') +
        polygon('18,82 30,70 22,66', '#FFB300') +
        polygon('82,82 70,70 78,66', '#FFB300') +
        // Sun body
        circle(50, 50, 20, '#FFC107') +
        circle(50, 50, 16, '#FFD54F'),
      ['sun', 'nature', 'sky', 'pictorial'],
      'Nature'
    )
  );

  // 3. Moon
  nature.push(
    block(
      'Crescent Moon',
      'Pictorial',
      rect(0, 0, 100, 100, '#1A237E') +
        // Moon crescent via overlapping circles
        circle(45, 45, 28, '#FFF9C4') +
        circle(55, 38, 24, '#1A237E') +
        // Stars
        circle(75, 25, 2, '#FFF') +
        circle(82, 45, 1.5, '#FFF') +
        circle(70, 70, 2, '#FFF') +
        circle(85, 65, 1, '#FFF') +
        circle(15, 75, 1.5, '#FFF') +
        circle(20, 20, 1, '#FFF'),
      ['moon', 'crescent', 'night', 'pictorial'],
      'Nature'
    )
  );

  // 4. Star
  nature.push(
    block(
      'Star',
      'Pictorial',
      rect(0, 0, 100, 100, '#1A237E') +
        polygon(regularPolygonPoints(50, 50, 40, 5, -90), '#FFC107') +
        polygon(regularPolygonPoints(50, 50, 40, 5, -90 + 36), '#1A237E') +
        circle(50, 50, 12, '#FFD54F'),
      ['star', 'night', 'sky', 'pictorial'],
      'Nature'
    )
  );

  // 5. Cloud
  nature.push(
    block(
      'Cloud',
      'Pictorial',
      rect(0, 0, 100, 100, '#87CEEB') +
        circle(40, 50, 18, '#FAFAFA') +
        circle(58, 45, 20, '#FAFAFA') +
        circle(72, 52, 15, '#FAFAFA') +
        circle(50, 55, 16, '#FAFAFA') +
        rect(25, 52, 60, 16, '#FAFAFA') +
        // Subtle shadow
        circle(42, 55, 15, '#ECEFF1') +
        circle(60, 58, 12, '#ECEFF1'),
      ['cloud', 'sky', 'weather', 'pictorial'],
      'Nature'
    )
  );

  // 6. Rainbow
  nature.push(
    block(
      'Rainbow',
      'Pictorial',
      rect(0, 0, 100, 100, '#87CEEB') +
        path('M 5 85 A 45 45 0 0 1 95 85', '#E53935') +
        path('M 12 85 A 38 38 0 0 1 88 85', '#FF9800') +
        path('M 19 85 A 31 31 0 0 1 81 85', '#FFC107') +
        path('M 26 85 A 24 24 0 0 1 74 85', '#4CAF50') +
        path('M 33 85 A 17 17 0 0 1 67 85', '#2196F3') +
        path('M 40 85 A 10 10 0 0 1 60 85', '#7B1FA2') +
        // Ground cover
        rect(0, 82, 100, 18, '#4CAF50'),
      ['rainbow', 'nature', 'sky', 'pictorial'],
      'Nature'
    )
  );

  // 7. Waterfall
  nature.push(
    block(
      'Waterfall',
      'Pictorial',
      rect(0, 0, 100, 100, '#87CEEB') +
        // Cliff sides
        polygon('0,20 30,20 30,100 0,100', '#795548') +
        polygon('70,20 100,20 100,100 70,100', '#795548') +
        // Water falling
        rect(30, 20, 40, 80, '#42A5F5') +
        rect(35, 20, 5, 80, '#90CAF9') +
        rect(55, 20, 5, 80, '#90CAF9') +
        // Pool
        path('M 20 90 Q 50 80 80 90 Q 50 100 20 90', '#1E88E5') +
        // Mist
        circle(50, 82, 8, '#E3F2FD') +
        circle(40, 85, 5, '#E3F2FD'),
      ['waterfall', 'water', 'nature', 'pictorial'],
      'Nature'
    )
  );

  // 8. Desert Cactus
  nature.push(
    block(
      'Desert Cactus',
      'Pictorial',
      rect(0, 0, 100, 100, '#FFE0B2') +
        // Ground
        rect(0, 85, 100, 15, '#D2B48C') +
        // Main trunk
        rect(42, 30, 16, 55, '#2E7D32') +
        // Arms
        rect(25, 40, 17, 10, '#388E3C') +
        rect(25, 30, 10, 15, '#388E3C') +
        rect(58, 50, 17, 10, '#388E3C') +
        rect(68, 35, 10, 20, '#388E3C') +
        // Sun
        circle(80, 15, 10, '#FFC107'),
      ['cactus', 'desert', 'nature', 'pictorial'],
      'Nature'
    )
  );

  // 9. Wave
  nature.push(
    block(
      'Ocean Wave',
      'Pictorial',
      rect(0, 0, 100, 100, '#87CEEB') +
        // Wave crest
        path('M 0 45 Q 25 25 50 45 Q 75 65 100 45 L 100 100 L 0 100 Z', '#1565C0') +
        path('M 0 55 Q 25 35 50 55 Q 75 75 100 55 L 100 100 L 0 100 Z', '#1976D2') +
        path('M 0 65 Q 25 50 50 65 Q 75 80 100 65 L 100 100 L 0 100 Z', '#1E88E5') +
        // Foam
        path('M 0 45 Q 10 42 20 45 Q 30 48 40 45', '#E3F2FD') +
        // Sun reflection
        circle(75, 20, 8, '#FFF9C4'),
      ['wave', 'ocean', 'water', 'pictorial'],
      'Nature'
    )
  );

  // 10. Sunset
  nature.push(
    block(
      'Sunset',
      'Pictorial',
      rect(0, 0, 100, 50, '#FF6F00') +
        rect(0, 0, 100, 20, '#E65100') +
        rect(0, 20, 100, 15, '#FF8F00') +
        rect(0, 35, 100, 15, '#FFA726') +
        rect(0, 50, 100, 50, '#1A237E') +
        // Sun
        path('M 30 50 A 20 20 0 0 1 70 50', '#FFC107') +
        // Water reflections
        rect(35, 55, 30, 2, '#FF8F00') +
        rect(38, 62, 24, 2, '#FFA726') +
        rect(40, 69, 20, 2, '#FFB74D') +
        rect(42, 76, 16, 2, '#FFCC80'),
      ['sunset', 'sky', 'nature', 'pictorial'],
      'Nature'
    )
  );

  return nature;
}

// ---------------------------------------------------------------------------
// Objects (10)
// ---------------------------------------------------------------------------
function generateObjects(): BlockDefinition[] {
  const objects: BlockDefinition[] = [];

  // 1. Boat
  objects.push(
    block(
      'Sailboat',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.ocean.bg) +
        // Water
        path('M 0 70 Q 25 65 50 70 Q 75 75 100 70 L 100 100 L 0 100 Z', '#42A5F5') +
        // Hull
        polygon('20,70 80,70 70,85 30,85', '#795548') +
        // Mast
        rect(48, 15, 4, 55, '#5D4037') +
        // Sail
        polygon('52,18 90,55 52,60', '#FAFAFA') +
        polygon('48,20 15,55 48,55', '#E0E0E0'),
      ['boat', 'sailboat', 'ocean', 'pictorial'],
      'Objects'
    )
  );

  // 2. Airplane
  objects.push(
    block(
      'Airplane',
      'Pictorial',
      rect(0, 0, 100, 100, '#87CEEB') +
        // Fuselage
        path('M 10 50 Q 30 45 80 48 Q 95 50 80 52 Q 30 55 10 50', '#BDBDBD') +
        // Wings
        polygon('40,48 55,48 65,25 35,25', '#9E9E9E') +
        polygon('40,52 55,52 65,75 35,75', '#9E9E9E') +
        // Tail
        polygon('10,50 5,35 15,48', '#757575') +
        polygon('10,50 5,65 15,52', '#757575') +
        // Windows
        circle(70, 49, 2, '#42A5F5') +
        circle(62, 49, 2, '#42A5F5') +
        circle(54, 49.5, 2, '#42A5F5'),
      ['airplane', 'plane', 'travel', 'pictorial'],
      'Objects'
    )
  );

  // 3. Anchor
  objects.push(
    block(
      'Anchor',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.ocean.bg) +
        // Ring at top
        circle(50, 18, 8, 'none') +
        path('M 42 18 A 8 8 0 1 1 58 18 A 8 8 0 1 1 42 18', '#455A64') +
        // Shaft
        rect(47, 25, 6, 50, '#455A64') +
        // Cross bar
        rect(30, 40, 40, 6, '#455A64') +
        // Flukes (arms)
        path('M 25 75 Q 30 85 47 75', '#455A64') +
        path('M 75 75 Q 70 85 53 75', '#455A64') +
        // Arrow tips
        polygon('20,72 25,75 18,80', '#455A64') +
        polygon('80,72 75,75 82,80', '#455A64'),
      ['anchor', 'nautical', 'ocean', 'pictorial'],
      'Objects'
    )
  );

  // 4. Crown
  objects.push(
    block(
      'Crown',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.jewel.bg) +
        // Crown body
        polygon('15,70 15,35 30,50 50,25 70,50 85,35 85,70', '#FFC107') +
        // Base band
        rect(15, 65, 70, 10, '#FF8F00') +
        // Jewels
        circle(30, 50, 4, '#E53935') +
        circle(50, 35, 4, '#1E88E5') +
        circle(70, 50, 4, '#4CAF50') +
        // Band jewels
        circle(35, 70, 3, '#E91E63') +
        circle(50, 70, 3, '#E91E63') +
        circle(65, 70, 3, '#E91E63'),
      ['crown', 'royal', 'regal', 'pictorial'],
      'Objects'
    )
  );

  // 5. Key
  objects.push(
    block(
      'Key',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.warm.bg) +
        // Bow (handle)
        circle(30, 35, 15, '#FFB300') +
        circle(30, 35, 8, PALETTES.warm.bg) +
        // Shaft
        rect(42, 32, 40, 6, '#FFB300') +
        // Bit (teeth)
        rect(75, 38, 6, 12, '#FFB300') +
        rect(68, 38, 6, 8, '#FFB300') +
        rect(82, 32, 4, 6, '#FF8F00'),
      ['key', 'lock', 'object', 'pictorial'],
      'Objects'
    )
  );

  // 6. Umbrella
  objects.push(
    block(
      'Umbrella',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.cool.bg) +
        // Canopy
        path('M 15 50 Q 50 10 85 50', '#E53935') +
        path('M 15 50 Q 27 30 38 50', '#C62828') +
        path('M 38 50 Q 50 30 62 50', '#E53935') +
        path('M 62 50 Q 74 30 85 50', '#C62828') +
        // Handle
        rect(48, 50, 4, 35, '#5D4037') +
        // Hook
        path('M 48 85 Q 42 92 38 85', '#5D4037') +
        // Tip
        polygon('50,12 48,18 52,18', '#FFB300'),
      ['umbrella', 'rain', 'object', 'pictorial'],
      'Objects'
    )
  );

  // 7. Hot Air Balloon
  objects.push(
    block(
      'Hot Air Balloon',
      'Pictorial',
      rect(0, 0, 100, 100, '#87CEEB') +
        // Envelope
        path('M 50 8 Q 15 20 18 50 Q 22 68 40 72 L 60 72 Q 78 68 82 50 Q 85 20 50 8', '#E53935') +
        path('M 50 8 Q 35 20 35 50 Q 36 68 45 72 L 55 72 Q 64 68 65 50 Q 65 20 50 8', '#FFC107') +
        path('M 50 8 Q 45 20 45 50 Q 45 68 48 72 L 52 72 Q 55 68 55 50 Q 55 20 50 8', '#4CAF50') +
        // Ropes
        path('M 40 72 L 38 82', '#5D4037') +
        path('M 60 72 L 62 82', '#5D4037') +
        // Basket
        rect(36, 82, 28, 12, '#795548') +
        rect(36, 82, 28, 3, '#5D4037'),
      ['balloon', 'hot air', 'flying', 'pictorial'],
      'Objects'
    )
  );

  // 8. Compass
  objects.push(
    block(
      'Compass',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.ocean.bg) +
        // Outer ring
        circle(50, 50, 40, '#FFF9C4') +
        circle(50, 50, 36, '#FFF') +
        // Cardinal points
        polygon('50,14 46,45 54,45', '#E53935') + // N arrow
        polygon('50,86 46,55 54,55', '#BDBDBD') + // S arrow
        polygon('14,50 45,46 45,54', '#BDBDBD') + // W arrow
        polygon('86,50 55,46 55,54', '#BDBDBD') + // E arrow
        // Center
        circle(50, 50, 4, '#FFB300'),
      ['compass', 'navigation', 'travel', 'pictorial'],
      'Objects'
    )
  );

  // 9. Camera
  objects.push(
    block(
      'Camera',
      'Pictorial',
      rect(0, 0, 100, 100, PALETTES.cool.bg) +
        // Body
        rect(15, 30, 70, 45, '#424242') +
        // Top bump
        rect(35, 22, 20, 10, '#616161') +
        // Lens
        circle(50, 55, 16, '#212121') +
        circle(50, 55, 12, '#37474F') +
        circle(50, 55, 6, '#546E7A') +
        // Flash
        rect(68, 34, 12, 6, '#FFD54F') +
        // Viewfinder
        rect(22, 35, 10, 8, '#616161'),
      ['camera', 'photo', 'object', 'pictorial'],
      'Objects'
    )
  );

  // 10. Lantern
  objects.push(
    block(
      'Lantern',
      'Pictorial',
      rect(0, 0, 100, 100, '#1A237E') +
        // Top cap
        rect(38, 15, 24, 5, '#5D4037') +
        // Handle
        path('M 44 15 Q 50 5 56 15', '#5D4037') +
        // Glass body
        rect(35, 20, 30, 50, '#FFF9C4') +
        // Frame lines
        rect(35, 20, 2, 50, '#5D4037') +
        rect(63, 20, 2, 50, '#5D4037') +
        rect(49, 20, 2, 50, '#5D4037') +
        // Flame
        path('M 50 55 Q 44 42 50 30 Q 56 42 50 55', '#FF9800') +
        path('M 50 52 Q 47 44 50 35 Q 53 44 50 52', '#FFC107') +
        // Bottom cap
        rect(35, 70, 30, 5, '#5D4037') +
        // Base
        rect(38, 75, 24, 5, '#5D4037'),
      ['lantern', 'light', 'object', 'pictorial'],
      'Objects'
    )
  );

  return objects;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function generatePictorialBlocks(): BlockDefinition[] {
  return [
    ...generateHouses(),
    ...generateHearts(),
    ...generateTrees(),
    ...generateAnimals(),
    ...generateBaskets(),
    ...generateFlowers(),
    ...generateNature(),
    ...generateObjects(),
  ];
}
