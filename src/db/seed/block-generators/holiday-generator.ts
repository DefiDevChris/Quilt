/**
 * Holiday quilt block generator.
 * Generates 60+ seasonal and holiday-themed blocks
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
// Christmas (15)
// ---------------------------------------------------------------------------
function generateChristmas(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];

  // 1. Christmas Tree
  blocks.push(
    block(
      'Christmas Tree',
      'Holiday',
      rect(0, 0, 100, 100, '#E8F5E9') +
        polygon('50,5 20,40 80,40', '#2E7D32') +
        polygon('50,25 15,65 85,65', '#388E3C') +
        polygon('50,45 10,90 90,90', '#43A047') +
        rect(43, 85, 14, 15, '#5D4037') +
        // Star on top
        polygon(regularPolygonPoints(50, 8, 6, 5, -90), '#FFC107') +
        // Ornaments
        circle(35, 50, 3, '#E53935') +
        circle(65, 55, 3, '#1E88E5') +
        circle(50, 70, 3, '#FFC107') +
        circle(40, 78, 3, '#E91E63') +
        circle(60, 40, 3, '#FF9800'),
      ['christmas', 'tree', 'holiday', 'winter'],
      'Christmas'
    )
  );

  // 2. Christmas Ornament
  blocks.push(
    block(
      'Christmas Ornament',
      'Holiday',
      rect(0, 0, 100, 100, '#1B5E20') +
        // Cap
        rect(44, 15, 12, 8, '#FFB300') +
        rect(48, 10, 4, 8, '#FFB300') +
        // String
        path('M 50 10 Q 55 5 50 2', '#9E9E9E') +
        // Ball
        circle(50, 50, 28, '#E53935') +
        // Decorative band
        path('M 25 45 Q 50 35 75 45', '#FFC107') +
        path('M 25 55 Q 50 65 75 55', '#FFC107') +
        // Highlight
        circle(40, 38, 5, '#EF9A9A'),
      ['christmas', 'ornament', 'decoration', 'holiday'],
      'Christmas'
    )
  );

  // 3. Candy Cane
  blocks.push(
    block(
      'Candy Cane',
      'Holiday',
      rect(0, 0, 100, 100, '#E8F5E9') +
        // Cane hook
        path('M 55 20 Q 55 8 45 8 Q 30 8 30 22', '#FFF') +
        // Straight part
        rect(50, 20, 10, 70, '#FFF') +
        // Red stripes
        polygon('50,25 60,20 60,30 50,35', '#E53935') +
        polygon('50,40 60,35 60,45 50,50', '#E53935') +
        polygon('50,55 60,50 60,60 50,65', '#E53935') +
        polygon('50,70 60,65 60,75 50,80', '#E53935') +
        polygon('50,85 60,80 60,90 50,90', '#E53935') +
        // Hook stripes
        path('M 42 12 Q 42 8 48 8 Q 54 8 54 14', '#E53935') +
        path('M 34 18 Q 32 12 38 10', '#E53935'),
      ['christmas', 'candy cane', 'sweet', 'holiday'],
      'Christmas'
    )
  );

  // 4. Wreath
  blocks.push(
    block(
      'Christmas Wreath',
      'Holiday',
      rect(0, 0, 100, 100, '#EFEBE9') +
        // Wreath circle (outer)
        circle(50, 50, 35, '#2E7D32') +
        // Inner hole
        circle(50, 50, 20, '#EFEBE9') +
        // Berry clusters
        circle(50, 18, 4, '#E53935') +
        circle(45, 20, 3, '#E53935') +
        circle(55, 20, 3, '#E53935') +
        circle(25, 35, 3, '#E53935') +
        circle(75, 35, 3, '#E53935') +
        circle(25, 65, 3, '#E53935') +
        circle(75, 65, 3, '#E53935') +
        // Bow at bottom
        path('M 42 82 Q 35 75 42 70 Q 50 75 42 82', '#E53935') +
        path('M 58 82 Q 65 75 58 70 Q 50 75 58 82', '#E53935') +
        rect(47, 78, 6, 8, '#C62828') +
        // Leaves detail
        path('M 30 25 Q 35 22 38 28', '#1B5E20') +
        path('M 70 25 Q 65 22 62 28', '#1B5E20'),
      ['christmas', 'wreath', 'decoration', 'holiday'],
      'Christmas'
    )
  );

  // 5. Stocking
  blocks.push(
    block(
      'Christmas Stocking',
      'Holiday',
      rect(0, 0, 100, 100, '#EFEBE9') +
        // Stocking body
        path(
          'M 35 10 L 35 65 Q 35 85 55 85 L 80 85 Q 85 85 85 75 L 85 65 L 60 65 L 60 10 Z',
          '#E53935'
        ) +
        // Cuff
        rect(33, 8, 30, 12, '#FAFAFA') +
        // Trim on cuff
        rect(33, 8, 30, 3, '#E0E0E0') +
        // Toe
        path('M 85 75 Q 85 88 75 88 L 55 88 Q 35 88 35 75', '#C62828') +
        // Heel
        path('M 60 65 Q 65 65 65 72 L 60 72', '#C62828') +
        // Decorative elements
        circle(47, 35, 3, '#4CAF50') +
        circle(47, 50, 3, '#4CAF50'),
      ['christmas', 'stocking', 'holiday'],
      'Christmas'
    )
  );

  // 6. Snowman
  blocks.push(
    block(
      'Snowman',
      'Holiday',
      rect(0, 0, 100, 100, '#E3F2FD') +
        // Body (three snowballs)
        circle(50, 75, 20, '#FAFAFA') +
        circle(50, 48, 15, '#FAFAFA') +
        circle(50, 26, 11, '#FAFAFA') +
        // Hat
        rect(40, 8, 20, 8, '#333') +
        rect(36, 15, 28, 3, '#333') +
        // Eyes
        circle(45, 24, 2, '#333') +
        circle(55, 24, 2, '#333') +
        // Carrot nose
        polygon('50,28 58,30 50,32', '#FF9800') +
        // Buttons
        circle(50, 42, 2, '#333') +
        circle(50, 50, 2, '#333') +
        circle(50, 58, 2, '#333') +
        // Scarf
        path('M 38 34 Q 50 38 62 34', '#E53935') +
        rect(55, 34, 5, 12, '#E53935') +
        // Arms
        path('M 35 48 L 15 35', '#5D4037') +
        path('M 65 48 L 85 35', '#5D4037'),
      ['christmas', 'snowman', 'winter', 'holiday'],
      'Christmas'
    )
  );

  // 7. Gingerbread Man
  blocks.push(
    block(
      'Gingerbread Man',
      'Holiday',
      rect(0, 0, 100, 100, '#EFEBE9') +
        // Head
        circle(50, 22, 12, '#8D6E63') +
        // Body
        rect(40, 32, 20, 25, '#8D6E63') +
        // Arms
        path('M 40 35 Q 25 30 15 40 Q 20 48 25 45 L 40 45', '#8D6E63') +
        path('M 60 35 Q 75 30 85 40 Q 80 48 75 45 L 60 45', '#8D6E63') +
        // Legs
        path('M 40 57 L 30 80 Q 28 85 35 85 L 42 85 L 45 57', '#8D6E63') +
        path('M 55 57 L 58 85 L 65 85 Q 72 85 70 80 L 60 57', '#8D6E63') +
        // Eyes
        circle(45, 20, 2, '#FFF') +
        circle(55, 20, 2, '#FFF') +
        // Mouth
        path('M 44 27 Q 50 32 56 27', '#FFF') +
        // Buttons
        circle(50, 38, 2, '#E53935') +
        circle(50, 46, 2, '#4CAF50') +
        // Icing trim
        path('M 42 32 Q 50 30 58 32', '#FFF') +
        path('M 32 78 Q 36 75 40 78', '#FFF') +
        path('M 60 78 Q 64 75 68 78', '#FFF'),
      ['christmas', 'gingerbread', 'cookie', 'holiday'],
      'Christmas'
    )
  );

  // 8. Present/Gift Box
  blocks.push(
    block(
      'Gift Box',
      'Holiday',
      rect(0, 0, 100, 100, '#E8F5E9') +
        // Box body
        rect(15, 35, 70, 55, '#E53935') +
        // Box lid
        rect(12, 25, 76, 12, '#C62828') +
        // Vertical ribbon
        rect(46, 25, 8, 65, '#FFC107') +
        // Horizontal ribbon
        rect(15, 55, 70, 8, '#FFC107') +
        // Bow
        path('M 46 25 Q 35 10 46 15', '#FFC107') +
        path('M 54 25 Q 65 10 54 15', '#FFC107') +
        rect(46, 18, 8, 8, '#FFB300'),
      ['christmas', 'present', 'gift', 'holiday'],
      'Christmas'
    )
  );

  // 9. Star of Bethlehem
  blocks.push(
    block(
      'Star of Bethlehem',
      'Holiday',
      rect(0, 0, 100, 100, '#1A237E') +
        // Large 8-pointed star
        polygon('50,5 55,40 90,50 55,60 50,95 45,60 10,50 45,40', '#FFC107') +
        polygon('50,5 40,40 5,5 40,25', '#FFD54F') +
        polygon('50,5 60,40 95,5 60,25', '#FFD54F') +
        polygon('50,95 40,60 5,95 40,75', '#FFD54F') +
        polygon('50,95 60,60 95,95 60,75', '#FFD54F') +
        // Center
        circle(50, 50, 8, '#FFF9C4') +
        // Beam of light
        polygon('45,95 50,60 55,95', '#FFF9C4'),
      ['christmas', 'star', 'bethlehem', 'holiday'],
      'Christmas'
    )
  );

  // 10. Holly
  blocks.push(
    block(
      'Holly',
      'Holiday',
      rect(0, 0, 100, 100, '#EFEBE9') +
        // Leaves
        path(
          'M 50 50 Q 25 30 15 20 Q 20 25 18 35 Q 15 40 25 38 Q 30 42 28 50 Q 32 48 40 50 Q 45 48 50 50',
          '#2E7D32'
        ) +
        path(
          'M 50 50 Q 75 30 85 20 Q 80 25 82 35 Q 85 40 75 38 Q 70 42 72 50 Q 68 48 60 50 Q 55 48 50 50',
          '#388E3C'
        ) +
        path(
          'M 50 50 Q 35 70 25 80 Q 30 75 35 78 Q 40 82 42 72 Q 46 68 50 70 Q 48 62 50 50',
          '#2E7D32'
        ) +
        path(
          'M 50 50 Q 65 70 75 80 Q 70 75 65 78 Q 60 82 58 72 Q 54 68 52 70 Q 52 62 50 50',
          '#388E3C'
        ) +
        // Berries
        circle(50, 48, 5, '#E53935') +
        circle(44, 52, 4, '#E53935') +
        circle(56, 52, 4, '#E53935') +
        // Berry highlights
        circle(48, 46, 1.5, '#EF9A9A') +
        circle(42, 50, 1.5, '#EF9A9A') +
        circle(54, 50, 1.5, '#EF9A9A'),
      ['christmas', 'holly', 'berries', 'holiday'],
      'Christmas'
    )
  );

  // 11. Reindeer
  blocks.push(
    block(
      'Reindeer',
      'Holiday',
      rect(0, 0, 100, 100, '#E3F2FD') +
        // Body
        path('M 30 85 Q 25 55 45 50 L 70 48 Q 80 50 75 85 Z', '#8D6E63') +
        // Head
        circle(72, 35, 12, '#8D6E63') +
        // Antlers
        path('M 66 25 L 58 10 M 62 15 L 55 10', '#5D4037') +
        path('M 78 25 L 86 10 M 82 15 L 89 10', '#5D4037') +
        // Eye
        circle(75, 33, 2, '#333') +
        // Red nose
        circle(82, 38, 4, '#E53935') +
        // Legs
        rect(35, 75, 6, 20, '#795548') +
        rect(60, 75, 6, 20, '#795548'),
      ['christmas', 'reindeer', 'animal', 'holiday'],
      'Christmas'
    )
  );

  // 12. Angel
  blocks.push(
    block(
      'Angel',
      'Holiday',
      rect(0, 0, 100, 100, '#E8EAF6') +
        // Gown
        polygon('35,45 65,45 75,95 25,95', '#FFF') +
        // Wings
        path('M 35 50 Q 10 35 15 55 Q 18 65 35 60', '#E0E0E0') +
        path('M 65 50 Q 90 35 85 55 Q 82 65 65 60', '#E0E0E0') +
        // Head
        circle(50, 32, 12, '#FFCC80') +
        // Hair
        path('M 38 30 Q 40 18 50 18 Q 60 18 62 30', '#FFB300') +
        // Halo
        circle(50, 18, 8, 'none') +
        path('M 42 18 A 8 5 0 1 1 58 18', '#FFC107') +
        // Face
        circle(46, 32, 1.5, '#333') +
        circle(54, 32, 1.5, '#333') +
        path('M 47 36 Q 50 38 53 36', '#E91E63'),
      ['christmas', 'angel', 'holiday'],
      'Christmas'
    )
  );

  // 13. Bell
  blocks.push(
    block(
      'Christmas Bell',
      'Holiday',
      rect(0, 0, 100, 100, '#E8F5E9') +
        // Bell body
        path('M 30 70 Q 28 40 40 25 Q 45 20 50 18 Q 55 20 60 25 Q 72 40 70 70 Z', '#FFC107') +
        // Bell opening
        path('M 25 70 Q 50 80 75 70 Q 50 75 25 70', '#FF8F00') +
        // Clapper
        circle(50, 72, 5, '#FF8F00') +
        // Top
        rect(46, 12, 8, 8, '#FFB300') +
        // Bow
        path('M 46 14 Q 35 5 42 12', '#E53935') +
        path('M 54 14 Q 65 5 58 12', '#E53935') +
        // Highlight
        path('M 40 35 Q 42 45 38 55', '#FFE082'),
      ['christmas', 'bell', 'jingle', 'holiday'],
      'Christmas'
    )
  );

  // 14. Nutcracker
  blocks.push(
    block(
      'Nutcracker',
      'Holiday',
      rect(0, 0, 100, 100, '#EFEBE9') +
        // Hat
        rect(38, 5, 24, 20, '#333') +
        rect(35, 22, 30, 5, '#FFC107') +
        // Face
        rect(38, 27, 24, 15, '#FFCC80') +
        // Eyes
        circle(45, 32, 2, '#333') +
        circle(55, 32, 2, '#333') +
        // Mouth
        rect(44, 38, 12, 3, '#E53935') +
        // Body
        rect(35, 42, 30, 30, '#E53935') +
        // Belt
        rect(35, 58, 30, 5, '#333') +
        rect(46, 56, 8, 8, '#FFC107') +
        // Legs
        rect(38, 72, 10, 23, '#1A237E') +
        rect(52, 72, 10, 23, '#1A237E') +
        // Boots
        rect(36, 90, 14, 5, '#333') +
        rect(50, 90, 14, 5, '#333') +
        // Buttons
        circle(50, 48, 2, '#FFC107') +
        circle(50, 54, 2, '#FFC107'),
      ['christmas', 'nutcracker', 'soldier', 'holiday'],
      'Christmas'
    )
  );

  // 15. Poinsettia
  blocks.push(
    block(
      'Poinsettia',
      'Holiday',
      rect(0, 0, 100, 100, '#E8F5E9') +
        // Outer petals (bracts)
        path('M 50 50 L 50 8 Q 55 25 58 30 Q 55 40 50 50', '#C62828') +
        path('M 50 50 L 50 92 Q 45 75 42 70 Q 45 60 50 50', '#C62828') +
        path('M 50 50 L 8 50 Q 25 45 30 42 Q 40 45 50 50', '#C62828') +
        path('M 50 50 L 92 50 Q 75 55 70 58 Q 60 55 50 50', '#C62828') +
        // Diagonal petals
        path('M 50 50 L 22 22 Q 32 32 38 35 Q 42 42 50 50', '#E53935') +
        path('M 50 50 L 78 22 Q 68 32 62 35 Q 58 42 50 50', '#E53935') +
        path('M 50 50 L 22 78 Q 32 68 38 62 Q 42 58 50 50', '#E53935') +
        path('M 50 50 L 78 78 Q 68 68 62 62 Q 58 58 50 50', '#E53935') +
        // Center berries
        circle(50, 50, 4, '#FFC107') +
        circle(46, 47, 2, '#FFB300') +
        circle(54, 47, 2, '#FFB300') +
        circle(48, 53, 2, '#FFB300') +
        circle(52, 53, 2, '#FFB300'),
      ['christmas', 'poinsettia', 'flower', 'holiday'],
      'Christmas'
    )
  );

  return blocks;
}

// ---------------------------------------------------------------------------
// Halloween (10)
// ---------------------------------------------------------------------------
function generateHalloween(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];

  // 1. Pumpkin
  blocks.push(
    block(
      'Pumpkin',
      'Holiday',
      rect(0, 0, 100, 100, '#1A237E') +
        // Pumpkin body
        path('M 50 20 Q 15 20 12 55 Q 12 85 50 88 Q 88 85 88 55 Q 85 20 50 20', '#FF6F00') +
        // Segments
        path('M 50 20 Q 45 50 50 88', '#E65100') +
        path('M 50 20 Q 30 40 30 88', '#E65100') +
        path('M 50 20 Q 70 40 70 88', '#E65100') +
        // Stem
        rect(46, 12, 8, 12, '#4CAF50') +
        // Face - eyes
        polygon('30,45 40,40 35,55', '#333') +
        polygon('60,40 70,45 65,55', '#333') +
        // Mouth
        path('M 30 65 L 38 60 L 46 68 L 54 60 L 62 68 L 70 65', '#333'),
      ['halloween', 'pumpkin', 'jack-o-lantern', 'holiday'],
      'Halloween'
    )
  );

  // 2. Spider Web
  blocks.push(
    block(
      'Spider Web',
      'Holiday',
      rect(0, 0, 100, 100, '#1A237E') +
        // Radial lines from corner
        path('M 0 0 L 100 100', '#9E9E9E') +
        path('M 0 0 L 50 100', '#9E9E9E') +
        path('M 0 0 L 100 50', '#9E9E9E') +
        path('M 0 0 L 100 0', '#9E9E9E') +
        path('M 0 0 L 0 100', '#9E9E9E') +
        path('M 0 0 L 75 100', '#9E9E9E') +
        path('M 0 0 L 100 75', '#9E9E9E') +
        // Concentric arcs
        path('M 15 0 Q 12 12 0 15', '#9E9E9E') +
        path('M 35 0 Q 28 28 0 35', '#9E9E9E') +
        path('M 55 0 Q 44 44 0 55', '#9E9E9E') +
        path('M 75 0 Q 60 60 0 75', '#9E9E9E') +
        path('M 95 0 Q 76 76 0 95', '#9E9E9E') +
        // Spider body
        circle(55, 55, 4, '#333') +
        circle(55, 50, 3, '#333') +
        // Spider legs
        path('M 52 52 L 40 45', '#333') +
        path('M 52 55 L 38 58', '#333') +
        path('M 58 52 L 70 45', '#333') +
        path('M 58 55 L 72 58', '#333'),
      ['halloween', 'spider', 'web', 'holiday'],
      'Halloween'
    )
  );

  // 3. Bat
  blocks.push(
    block(
      'Bat',
      'Holiday',
      rect(0, 0, 100, 100, '#1A237E') +
        // Body
        path('M 45 40 Q 42 55 45 65 Q 50 70 55 65 Q 58 55 55 40 Z', '#333') +
        // Head
        circle(50, 35, 8, '#333') +
        // Ears
        polygon('44,30 40,20 46,28', '#333') +
        polygon('56,30 60,20 54,28', '#333') +
        // Left wing
        path(
          'M 45 42 Q 20 30 5 50 Q 10 48 15 52 Q 12 55 8 60 Q 15 55 20 58 Q 18 62 15 68 Q 30 55 45 55',
          '#333'
        ) +
        // Right wing
        path(
          'M 55 42 Q 80 30 95 50 Q 90 48 85 52 Q 88 55 92 60 Q 85 55 80 58 Q 82 62 85 68 Q 70 55 55 55',
          '#333'
        ) +
        // Eyes
        circle(47, 34, 2, '#FFC107') +
        circle(53, 34, 2, '#FFC107') +
        // Moon
        circle(80, 15, 12, '#FFF9C4'),
      ['halloween', 'bat', 'spooky', 'holiday'],
      'Halloween'
    )
  );

  // 4. Ghost
  blocks.push(
    block(
      'Ghost',
      'Holiday',
      rect(0, 0, 100, 100, '#1A237E') +
        // Ghost body
        path(
          'M 30 85 Q 30 20 50 15 Q 70 20 70 85 Q 65 78 60 85 Q 55 78 50 85 Q 45 78 40 85 Q 35 78 30 85',
          '#FAFAFA'
        ) +
        // Eyes
        circle(40, 42, 5, '#333') +
        circle(58, 42, 5, '#333') +
        // Eye highlights
        circle(38, 40, 2, '#FFF') +
        circle(56, 40, 2, '#FFF') +
        // Mouth
        path('M 42 58 Q 50 65 58 58', '#333') +
        // Stars in background
        circle(15, 20, 1.5, '#FFF') +
        circle(85, 30, 1.5, '#FFF') +
        circle(20, 70, 1, '#FFF') +
        circle(80, 75, 1, '#FFF'),
      ['halloween', 'ghost', 'spooky', 'holiday'],
      'Halloween'
    )
  );

  // 5. Witch Hat
  blocks.push(
    block(
      'Witch Hat',
      'Holiday',
      rect(0, 0, 100, 100, '#4A148C') +
        // Hat brim
        path('M 10 75 Q 50 68 90 75 Q 50 82 10 75', '#333') +
        // Hat cone
        polygon('30,75 50,12 70,75', '#333') +
        // Hat band
        polygon('32,72 50,22 68,72 50,30', '#FF6F00') +
        rect(32, 65, 36, 10, '#FF6F00') +
        // Buckle
        rect(44, 66, 12, 8, '#FFC107') +
        rect(47, 68, 6, 4, '#333') +
        // Tip curl
        path('M 50 12 Q 62 8 65 15', '#333') +
        // Stars
        circle(15, 25, 2, '#FFC107') +
        circle(82, 35, 1.5, '#FFC107') +
        circle(20, 55, 1, '#FFC107'),
      ['halloween', 'witch', 'hat', 'holiday'],
      'Halloween'
    )
  );

  // 6. Haunted House
  blocks.push(
    block(
      'Haunted House',
      'Holiday',
      rect(0, 0, 100, 100, '#1A237E') +
        // House body
        rect(15, 45, 70, 50, '#37474F') +
        // Roof
        polygon('10,45 50,15 90,45', '#263238') +
        // Tower
        rect(60, 15, 18, 35, '#37474F') +
        polygon('58,15 69,2 80,15', '#263238') +
        // Windows (glowing)
        rect(25, 55, 12, 12, '#FFC107') +
        rect(63, 55, 12, 12, '#FFC107') +
        rect(63, 22, 10, 10, '#FFC107') +
        // Door
        rect(42, 65, 16, 30, '#263238') +
        circle(54, 80, 2, '#FFC107') +
        // Moon
        circle(85, 10, 8, '#FFF9C4') +
        // Bat silhouette
        path('M 30 20 Q 25 15 20 20 Q 25 18 30 20 Q 35 18 40 20 Q 35 15 30 20', '#333'),
      ['halloween', 'haunted', 'house', 'holiday'],
      'Halloween'
    )
  );

  // 7. Skull
  blocks.push(
    block(
      'Skull',
      'Holiday',
      rect(0, 0, 100, 100, '#1A237E') +
        // Skull shape
        path('M 30 60 Q 25 30 50 20 Q 75 30 70 60 Q 68 70 60 72 L 40 72 Q 32 70 30 60', '#FAFAFA') +
        // Jaw
        path('M 38 72 Q 40 82 50 84 Q 60 82 62 72', '#F5F5F5') +
        // Eye sockets
        circle(40, 45, 8, '#1A237E') +
        circle(60, 45, 8, '#1A237E') +
        // Nose
        polygon('50,55 46,62 54,62', '#1A237E') +
        // Teeth
        rect(40, 72, 5, 5, '#FAFAFA') +
        rect(47, 72, 6, 5, '#FAFAFA') +
        rect(55, 72, 5, 5, '#FAFAFA'),
      ['halloween', 'skull', 'spooky', 'holiday'],
      'Halloween'
    )
  );

  // 8. Cauldron
  blocks.push(
    block(
      'Cauldron',
      'Holiday',
      rect(0, 0, 100, 100, '#1A237E') +
        // Cauldron body
        path('M 20 40 Q 15 80 50 85 Q 85 80 80 40 Z', '#333') +
        // Rim
        path('M 18 40 Q 50 35 82 40 Q 50 45 18 40', '#424242') +
        // Legs
        polygon('28,82 25,95 32,95', '#333') +
        polygon('68,82 72,95 78,95', '#333') +
        // Bubbling potion
        circle(40, 38, 6, '#4CAF50') +
        circle(55, 35, 4, '#66BB6A') +
        circle(65, 38, 5, '#4CAF50') +
        // Rising bubbles
        circle(45, 28, 3, '#81C784') +
        circle(55, 22, 2, '#A5D6A7') +
        circle(48, 16, 2, '#C8E6C9'),
      ['halloween', 'cauldron', 'witch', 'holiday'],
      'Halloween'
    )
  );

  // 9. Black Cat
  blocks.push(
    block(
      'Black Cat',
      'Holiday',
      rect(0, 0, 100, 100, '#FF6F00') +
        // Body
        path('M 30 90 Q 25 55 40 50 Q 60 45 70 55 Q 80 65 75 90 Z', '#333') +
        // Head
        circle(55, 38, 14, '#333') +
        // Ears
        polygon('44,28 40,12 50,25', '#333') +
        polygon('62,25 68,12 66,28', '#333') +
        // Eyes (glowing)
        circle(48, 36, 4, '#FFC107') +
        circle(62, 36, 4, '#FFC107') +
        circle(48, 36, 2, '#333') +
        circle(62, 36, 2, '#333') +
        // Tail
        path('M 30 80 Q 10 60 15 40 Q 18 30 25 35', '#333') +
        // Moon
        circle(85, 15, 10, '#FFF9C4'),
      ['halloween', 'cat', 'black cat', 'holiday'],
      'Halloween'
    )
  );

  // 10. Frankenstein
  blocks.push(
    block(
      'Frankenstein',
      'Holiday',
      rect(0, 0, 100, 100, '#4A148C') +
        // Head (square-ish)
        rect(28, 20, 44, 50, '#4CAF50') +
        // Hair
        rect(28, 15, 44, 10, '#333') +
        // Forehead line
        rect(28, 25, 44, 2, '#388E3C') +
        // Eyes
        rect(35, 35, 10, 8, '#FFF') +
        rect(55, 35, 10, 8, '#FFF') +
        circle(40, 39, 3, '#333') +
        circle(60, 39, 3, '#333') +
        // Nose
        rect(48, 45, 4, 8, '#388E3C') +
        // Mouth
        rect(35, 58, 30, 4, '#333') +
        // Stitches on mouth
        rect(38, 56, 2, 8, '#333') +
        rect(48, 56, 2, 8, '#333') +
        rect(58, 56, 2, 8, '#333') +
        // Bolts
        circle(25, 42, 4, '#9E9E9E') +
        circle(75, 42, 4, '#9E9E9E') +
        // Neck
        rect(38, 70, 24, 15, '#4CAF50'),
      ['halloween', 'frankenstein', 'monster', 'holiday'],
      'Halloween'
    )
  );

  return blocks;
}

// ---------------------------------------------------------------------------
// Thanksgiving (8)
// ---------------------------------------------------------------------------
function generateThanksgiving(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];

  // 1. Turkey
  blocks.push(
    block(
      'Turkey',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.autumn.bg) +
        // Tail feathers (fan)
        path('M 50 50 Q 20 10 10 30 Q 15 45 50 50', '#E53935') +
        path('M 50 50 Q 35 8 25 15 Q 25 35 50 50', '#FF9800') +
        path('M 50 50 Q 50 5 40 15 Q 35 30 50 50', '#FFC107') +
        path('M 50 50 Q 65 8 75 15 Q 75 35 50 50', '#4CAF50') +
        path('M 50 50 Q 80 10 90 30 Q 85 45 50 50', '#8D6E63') +
        // Body
        circle(50, 58, 18, '#795548') +
        // Head
        circle(50, 40, 8, '#795548') +
        // Beak
        polygon('50,44 45,48 55,48', '#FF8F00') +
        // Wattle
        path('M 50 48 Q 48 55 50 52', '#E53935') +
        // Eye
        circle(48, 38, 2, '#333') +
        // Feet
        path('M 42 75 L 38 88 L 32 90 M 38 88 L 44 90', '#FF8F00') +
        path('M 58 75 L 62 88 L 56 90 M 62 88 L 68 90', '#FF8F00'),
      ['thanksgiving', 'turkey', 'bird', 'holiday'],
      'Thanksgiving'
    )
  );

  // 2. Cornucopia
  blocks.push(
    block(
      'Cornucopia',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.autumn.bg) +
        // Horn shape
        path(
          'M 85 75 Q 70 70 40 60 Q 15 50 10 40 Q 12 35 18 38 Q 25 42 50 50 Q 75 58 85 65 Z',
          '#D4883C'
        ) +
        path('M 85 75 Q 85 80 80 80 Q 70 78 85 75', '#A0522D') +
        // Fruits spilling out
        circle(82, 60, 8, '#E53935') + // Apple
        circle(72, 52, 7, '#FF9800') + // Orange
        circle(78, 48, 6, '#9C27B0') + // Grape
        circle(88, 52, 6, '#FFC107') + // Lemon
        circle(85, 42, 5, '#4CAF50') + // Grape
        // Corn
        path('M 68 44 Q 72 38 78 42', '#FFC107') +
        // Leaf
        path('M 75 55 Q 82 40 90 38', '#4CAF50'),
      ['thanksgiving', 'cornucopia', 'harvest', 'holiday'],
      'Thanksgiving'
    )
  );

  // 3. Autumn Maple Leaf
  blocks.push(
    block(
      'Autumn Maple Leaf',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.autumn.bg) +
        polygon(
          '50,8 60,30 88,28 68,45 80,70 55,58 50,85 45,58 20,70 32,45 12,28 40,30',
          PALETTES.autumn.primary
        ) +
        // Veins
        path('M 50 85 L 50 8', PALETTES.autumn.secondary) +
        path('M 50 35 L 30 20', PALETTES.autumn.secondary) +
        path('M 50 35 L 70 20', PALETTES.autumn.secondary) +
        path('M 50 55 L 25 60', PALETTES.autumn.secondary) +
        path('M 50 55 L 75 60', PALETTES.autumn.secondary) +
        // Stem
        rect(48, 82, 4, 12, PALETTES.earth.secondary),
      ['thanksgiving', 'maple', 'leaf', 'autumn', 'holiday'],
      'Thanksgiving'
    )
  );

  // 4. Acorn
  blocks.push(
    block(
      'Acorn',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.autumn.bg) +
        // Cap
        path('M 30 45 Q 30 25 50 22 Q 70 25 70 45 Z', '#795548') +
        // Cap texture
        path('M 35 35 Q 50 30 65 35', '#5D4037') +
        path('M 33 40 Q 50 35 67 40', '#5D4037') +
        // Stem
        rect(47, 15, 6, 10, '#5D4037') +
        // Nut body
        path('M 32 45 Q 30 70 50 78 Q 70 70 68 45 Z', '#D4883C') +
        // Highlight
        path('M 42 50 Q 45 60 48 70', '#E0A050'),
      ['thanksgiving', 'acorn', 'autumn', 'holiday'],
      'Thanksgiving'
    )
  );

  // 5. Pilgrim Hat
  blocks.push(
    block(
      'Pilgrim Hat',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.autumn.bg) +
        // Hat crown
        rect(30, 20, 40, 45, '#333') +
        // Hat brim
        rect(15, 62, 70, 8, '#333') +
        // Buckle band
        rect(30, 55, 40, 10, '#795548') +
        // Buckle
        rect(42, 54, 16, 12, '#FFC107') +
        rect(46, 57, 8, 6, '#333'),
      ['thanksgiving', 'pilgrim', 'hat', 'holiday'],
      'Thanksgiving'
    )
  );

  // 6. Pie
  blocks.push(
    block(
      'Pumpkin Pie',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.autumn.bg) +
        // Pie dish
        path('M 10 60 Q 50 75 90 60 Q 85 70 50 78 Q 15 70 10 60', '#D4883C') +
        // Pie filling
        path('M 12 60 Q 50 45 88 60 Q 50 72 12 60', '#E65100') +
        // Crust edge
        path('M 10 60 Q 50 45 90 60', '#D4883C') +
        // Whipped cream dollop
        circle(50, 52, 8, '#FAFAFA') +
        circle(42, 55, 5, '#FAFAFA') +
        circle(58, 55, 5, '#FAFAFA') +
        // Slice line
        path('M 50 45 L 50 72', '#BF360C'),
      ['thanksgiving', 'pie', 'pumpkin', 'holiday'],
      'Thanksgiving'
    )
  );

  // 7. Wheat Sheaf
  blocks.push(
    block(
      'Wheat Sheaf',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.autumn.bg) +
        // Stalks
        path('M 50 90 L 40 40', '#D4883C') +
        path('M 50 90 L 50 35', '#D4883C') +
        path('M 50 90 L 60 40', '#D4883C') +
        path('M 50 90 L 35 45', '#BF8040') +
        path('M 50 90 L 65 45', '#BF8040') +
        // Wheat heads
        path('M 40 40 Q 35 30 38 20 Q 42 25 40 40', '#FFB300') +
        path('M 50 35 Q 45 22 48 12 Q 52 22 50 35', '#FFC107') +
        path('M 60 40 Q 55 30 58 20 Q 62 25 60 40', '#FFB300') +
        path('M 35 45 Q 28 35 30 25 Q 35 32 35 45', '#FFD54F') +
        path('M 65 45 Q 72 35 70 25 Q 65 32 65 45', '#FFD54F') +
        // Tie
        path('M 42 72 Q 50 68 58 72', '#E53935') +
        path('M 42 75 Q 50 71 58 75', '#E53935'),
      ['thanksgiving', 'wheat', 'harvest', 'holiday'],
      'Thanksgiving'
    )
  );

  // 8. Harvest Pumpkin
  blocks.push(
    block(
      'Harvest Pumpkin',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.autumn.bg) +
        // Pumpkin body
        path('M 50 22 Q 18 22 15 55 Q 15 82 50 85 Q 85 82 85 55 Q 82 22 50 22', '#FF8F00') +
        // Segments
        path('M 50 22 Q 48 50 50 85', '#E65100') +
        path('M 50 22 Q 32 38 32 85', '#E65100') +
        path('M 50 22 Q 68 38 68 85', '#E65100') +
        // Stem
        path('M 46 22 Q 44 12 48 8 Q 52 12 50 22', '#4CAF50') +
        // Leaf
        path('M 52 18 Q 65 10 70 15 Q 62 18 55 22', '#4CAF50') +
        // Highlight
        path('M 35 35 Q 38 50 36 65', '#FFB74D'),
      ['thanksgiving', 'pumpkin', 'harvest', 'holiday'],
      'Thanksgiving'
    )
  );

  return blocks;
}

// ---------------------------------------------------------------------------
// Valentine's Day (8)
// ---------------------------------------------------------------------------
function generateValentines(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];

  // 1. Double Heart
  blocks.push(
    block(
      'Double Heart',
      'Holiday',
      rect(0, 0, 100, 100, '#FCE4EC') +
        // Heart 1 (behind)
        path('M 55 70 Q 80 40 65 25 Q 55 20 50 30 Q 45 20 35 25 Q 20 40 55 70', '#F48FB1') +
        // Heart 2 (front, offset)
        path('M 50 75 Q 78 45 62 28 Q 52 22 46 33 Q 40 22 30 28 Q 14 45 50 75', '#E91E63'),
      ['valentine', 'heart', 'love', 'holiday'],
      "Valentine's Day"
    )
  );

  // 2. Cupid's Arrow
  blocks.push(
    block(
      "Cupid's Arrow",
      'Holiday',
      rect(0, 0, 100, 100, '#FCE4EC') +
        // Heart
        path('M 50 65 Q 75 35 60 22 Q 52 18 48 28 Q 44 18 36 22 Q 20 35 50 65', '#E53935') +
        // Arrow shaft
        path('M 15 85 L 85 15', '#795548') +
        // Arrow head
        polygon('85,15 75,12 82,22', '#9E9E9E') +
        // Arrow fletching
        polygon('15,85 20,78 12,80', '#E53935') +
        polygon('15,85 22,82 18,88', '#E53935'),
      ['valentine', 'cupid', 'arrow', 'holiday'],
      "Valentine's Day"
    )
  );

  // 3. Love Letter
  blocks.push(
    block(
      'Love Letter',
      'Holiday',
      rect(0, 0, 100, 100, '#FCE4EC') +
        // Envelope body
        rect(15, 30, 70, 45, '#FFF') +
        // Envelope flap
        polygon('15,30 50,55 85,30', '#F5F5F5') +
        // Envelope bottom fold
        polygon('15,75 50,55 85,75', '#E0E0E0') +
        // Heart seal
        path('M 50 42 Q 58 32 54 27 Q 52 25 50 28 Q 48 25 46 27 Q 42 32 50 42', '#E53935') +
        // Stamp area
        rect(65, 32, 12, 12, '#E91E63') +
        circle(71, 38, 4, '#FCE4EC'),
      ['valentine', 'letter', 'love', 'holiday'],
      "Valentine's Day"
    )
  );

  // 4. Rose Bouquet
  blocks.push(
    block(
      'Rose Bouquet',
      'Holiday',
      rect(0, 0, 100, 100, '#FCE4EC') +
        // Stems
        path('M 50 95 L 40 55', '#388E3C') +
        path('M 50 95 L 50 50', '#388E3C') +
        path('M 50 95 L 60 55', '#388E3C') +
        // Roses
        circle(40, 45, 10, '#E53935') +
        circle(40, 45, 5, '#C62828') +
        circle(50, 38, 12, '#F44336') +
        circle(50, 38, 6, '#D32F2F') +
        circle(60, 45, 10, '#E53935') +
        circle(60, 45, 5, '#C62828') +
        // Leaves
        path('M 42 60 Q 30 55 25 62', '#4CAF50') +
        path('M 58 60 Q 70 55 75 62', '#4CAF50') +
        // Ribbon
        path('M 44 80 Q 50 75 56 80', '#E91E63') +
        rect(47, 78, 6, 8, '#AD1457'),
      ['valentine', 'rose', 'bouquet', 'holiday'],
      "Valentine's Day"
    )
  );

  // 5. Heart Wreath
  blocks.push(
    block(
      'Heart Wreath',
      'Holiday',
      rect(0, 0, 100, 100, '#FCE4EC') +
        // Ring of small hearts (positioned around circle)
        path('M 50 15 Q 55 10 52 8 Q 50 10 48 8 Q 45 10 50 15', '#E53935') +
        path('M 75 25 Q 80 20 78 18 Q 76 20 74 18 Q 71 20 75 25', '#F44336') +
        path('M 85 50 Q 90 45 88 43 Q 86 45 84 43 Q 81 45 85 50', '#E53935') +
        path('M 75 75 Q 80 70 78 68 Q 76 70 74 68 Q 71 70 75 75', '#F44336') +
        path('M 50 85 Q 55 80 52 78 Q 50 80 48 78 Q 45 80 50 85', '#E53935') +
        path('M 25 75 Q 30 70 28 68 Q 26 70 24 68 Q 21 70 25 75', '#F44336') +
        path('M 15 50 Q 20 45 18 43 Q 16 45 14 43 Q 11 45 15 50', '#E53935') +
        path('M 25 25 Q 30 20 28 18 Q 26 20 24 18 Q 21 20 25 25', '#F44336') +
        // Center heart
        path('M 50 60 Q 68 40 58 30 Q 52 26 50 34 Q 48 26 42 30 Q 32 40 50 60', '#C62828'),
      ['valentine', 'wreath', 'heart', 'holiday'],
      "Valentine's Day"
    )
  );

  // 6. Pieced Heart Block
  blocks.push(
    block(
      'Valentine Pieced Heart',
      'Holiday',
      rect(0, 0, 100, 100, '#FFF') +
        hst(0, 0, 25, 25, '#FFF', '#E91E63') +
        rect(25, 0, 25, 25, '#E91E63') +
        rect(50, 0, 25, 25, '#E91E63') +
        hst(75, 0, 25, 25, '#E91E63', '#FFF') +
        rect(0, 25, 25, 25, '#E91E63') +
        rect(25, 25, 50, 25, '#E91E63') +
        rect(75, 25, 25, 25, '#E91E63') +
        hst(0, 50, 25, 25, '#FFF', '#E91E63') +
        rect(25, 50, 50, 25, '#E91E63') +
        hst(75, 50, 25, 25, '#E91E63', '#FFF') +
        hst(25, 75, 25, 25, '#FFF', '#E91E63') +
        hst(50, 75, 25, 25, '#E91E63', '#FFF'),
      ['valentine', 'heart', 'pieced', 'holiday'],
      "Valentine's Day"
    )
  );

  // 7. Love Birds
  blocks.push(
    block(
      'Love Birds',
      'Holiday',
      rect(0, 0, 100, 100, '#FCE4EC') +
        // Left bird
        path('M 25 55 Q 15 45 25 40 Q 35 38 35 50 Q 32 58 25 55', '#E91E63') +
        circle(22, 42, 2, '#333') +
        polygon('15,44 10,42 15,46', '#FFB300') +
        // Right bird
        path('M 75 55 Q 85 45 75 40 Q 65 38 65 50 Q 68 58 75 55', '#E91E63') +
        circle(78, 42, 2, '#333') +
        polygon('85,44 90,42 85,46', '#FFB300') +
        // Heart between them
        path('M 50 48 Q 56 40 53 36 Q 51 34 50 37 Q 49 34 47 36 Q 44 40 50 48', '#E53935') +
        // Branch
        path('M 20 60 Q 50 55 80 60', '#795548') +
        // Leaves
        path('M 40 57 Q 38 52 42 54', '#4CAF50') +
        path('M 60 57 Q 58 52 62 54', '#4CAF50'),
      ['valentine', 'birds', 'love', 'holiday'],
      "Valentine's Day"
    )
  );

  // 8. Heart in Hand
  blocks.push(
    block(
      'Heart in Hand',
      'Holiday',
      rect(0, 0, 100, 100, '#FCE4EC') +
        // Hand (simplified palm)
        path('M 30 55 Q 25 48 30 42 L 35 42 L 35 55', '#FFCC80') +
        path('M 35 50 Q 32 40 35 32 L 40 32 L 40 50', '#FFCC80') +
        path('M 40 48 Q 38 36 40 28 L 45 28 L 45 48', '#FFCC80') +
        path('M 45 50 Q 43 38 45 30 L 50 30 L 50 50', '#FFCC80') +
        rect(30, 55, 40, 20, '#FFCC80') +
        path('M 50 50 Q 55 42 60 45 L 60 55 Q 55 58 50 55', '#FFCC80') +
        path('M 60 45 Q 65 40 70 48 L 70 55', '#FFCC80') +
        // Heart floating above hand
        path('M 50 40 Q 62 22 56 14 Q 52 10 50 16 Q 48 10 44 14 Q 38 22 50 40', '#E53935'),
      ['valentine', 'heart', 'hand', 'holiday'],
      "Valentine's Day"
    )
  );

  return blocks;
}

// ---------------------------------------------------------------------------
// Easter (8)
// ---------------------------------------------------------------------------
function generateEaster(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];

  // 1. Easter Egg - Striped
  blocks.push(
    block(
      'Easter Egg - Striped',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        // Egg shape
        path('M 50 10 Q 20 20 18 50 Q 18 80 50 90 Q 82 80 82 50 Q 80 20 50 10', '#E3F2FD') +
        // Stripes
        path('M 25 30 Q 50 25 75 30', '#E91E63') +
        path('M 22 42 Q 50 37 78 42', '#FFC107') +
        path('M 20 54 Q 50 49 80 54', '#4CAF50') +
        path('M 22 66 Q 50 61 78 66', '#42A5F5') +
        path('M 28 78 Q 50 73 72 78', '#AB47BC'),
      ['easter', 'egg', 'decorated', 'holiday'],
      'Easter'
    )
  );

  // 2. Easter Egg - Dotted
  blocks.push(
    block(
      'Easter Egg - Dotted',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        path('M 50 10 Q 20 20 18 50 Q 18 80 50 90 Q 82 80 82 50 Q 80 20 50 10', '#FFF9C4') +
        // Dots
        circle(40, 30, 4, '#E91E63') +
        circle(60, 30, 4, '#4CAF50') +
        circle(30, 45, 4, '#42A5F5') +
        circle(50, 42, 4, '#FF9800') +
        circle(70, 45, 4, '#9C27B0') +
        circle(35, 60, 4, '#FFC107') +
        circle(55, 58, 4, '#E91E63') +
        circle(72, 60, 4, '#4CAF50') +
        circle(42, 74, 4, '#42A5F5') +
        circle(60, 72, 4, '#FF9800'),
      ['easter', 'egg', 'polka dot', 'holiday'],
      'Easter'
    )
  );

  // 3. Easter Bunny
  blocks.push(
    block(
      'Easter Bunny',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        // Body
        path('M 35 90 Q 25 65 50 58 Q 75 65 65 90 Z', '#FAFAFA') +
        // Head
        circle(50, 45, 15, '#FAFAFA') +
        // Ears
        path('M 40 32 Q 36 5 32 30', '#FAFAFA') +
        path('M 60 32 Q 64 5 68 30', '#FAFAFA') +
        // Inner ears
        path('M 42 30 Q 38 12 35 28', '#FFB3B3') +
        path('M 58 30 Q 62 12 65 28', '#FFB3B3') +
        // Eyes
        circle(43, 43, 3, '#333') +
        circle(57, 43, 3, '#333') +
        // Nose
        polygon('50,50 48,53 52,53', '#FFB3B3') +
        // Whiskers
        path('M 42 50 L 25 47', '#BDBDBD') +
        path('M 42 52 L 25 54', '#BDBDBD') +
        path('M 58 50 L 75 47', '#BDBDBD') +
        path('M 58 52 L 75 54', '#BDBDBD') +
        // Tail
        circle(50, 88, 5, '#FFF'),
      ['easter', 'bunny', 'rabbit', 'holiday'],
      'Easter'
    )
  );

  // 4. Easter Chick
  blocks.push(
    block(
      'Easter Chick',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        // Egg shell bottom
        path('M 25 55 Q 25 80 50 85 Q 75 80 75 55 Z', '#FAFAFA') +
        // Cracked edge
        path('M 25 55 L 32 50 L 38 58 L 45 48 L 52 56 L 58 48 L 65 55 L 72 48 L 75 55', '#E0E0E0') +
        // Chick body
        circle(50, 42, 15, '#FFC107') +
        // Head
        circle(50, 28, 10, '#FFD54F') +
        // Eyes
        circle(46, 26, 2, '#333') +
        circle(54, 26, 2, '#333') +
        // Beak
        polygon('50,30 47,34 53,34', '#FF8F00') +
        // Wing
        path('M 38 40 Q 28 35 32 45', '#FFB300') +
        path('M 62 40 Q 72 35 68 45', '#FFB300') +
        // Feet
        path('M 44 55 L 40 62 L 35 60 M 40 62 L 45 60', '#FF8F00') +
        path('M 56 55 L 60 62 L 55 60 M 60 62 L 65 60', '#FF8F00'),
      ['easter', 'chick', 'baby', 'holiday'],
      'Easter'
    )
  );

  // 5. Easter Cross
  blocks.push(
    block(
      'Easter Cross',
      'Holiday',
      rect(0, 0, 100, 100, '#E8EAF6') +
        // Cross
        rect(38, 10, 24, 80, '#8D6E63') +
        rect(18, 28, 64, 20, '#8D6E63') +
        // Inner cross
        rect(42, 14, 16, 72, '#A1887F') +
        rect(22, 32, 56, 12, '#A1887F') +
        // Flowers at base
        circle(30, 88, 5, '#E91E63') +
        circle(42, 92, 4, '#FFC107') +
        circle(58, 92, 4, '#9C27B0') +
        circle(70, 88, 5, '#E91E63') +
        // Leaves
        path('M 25 90 Q 20 85 22 92', '#4CAF50') +
        path('M 75 90 Q 80 85 78 92', '#4CAF50'),
      ['easter', 'cross', 'religious', 'holiday'],
      'Easter'
    )
  );

  // 6. Easter Basket
  blocks.push(
    block(
      'Easter Basket',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        // Handle
        path('M 25 45 Q 50 10 75 45', '#8D6E63') +
        path('M 28 45 Q 50 15 72 45', PALETTES.spring.bg) +
        // Basket body
        polygon('15,45 85,45 75,90 25,90', '#D4883C') +
        // Weave
        path('M 20 55 L 80 55', '#A0522D') +
        path('M 22 65 L 78 65', '#A0522D') +
        path('M 25 75 L 75 75', '#A0522D') +
        path('M 27 85 L 73 85', '#A0522D') +
        // Eggs in basket
        path('M 35 42 Q 32 34 35 28 Q 38 34 35 42', '#E91E63') +
        path('M 50 40 Q 47 30 50 24 Q 53 30 50 40', '#42A5F5') +
        path('M 65 42 Q 62 34 65 28 Q 68 34 65 42', '#FFC107') +
        // Grass
        path('M 20 44 L 25 38 L 30 44', '#4CAF50') +
        path('M 70 44 L 75 38 L 80 44', '#4CAF50'),
      ['easter', 'basket', 'eggs', 'holiday'],
      'Easter'
    )
  );

  // 7. Easter Lily
  blocks.push(
    block(
      'Easter Lily',
      'Holiday',
      rect(0, 0, 100, 100, '#E8EAF6') +
        // Stems
        path('M 50 95 L 45 50', '#388E3C') +
        path('M 50 95 L 55 48', '#388E3C') +
        path('M 50 95 L 50 45', '#388E3C') +
        // Leaves
        path('M 48 75 Q 30 68 25 78', '#4CAF50') +
        path('M 52 70 Q 70 63 75 73', '#4CAF50') +
        // Lily petals (three flowers)
        path('M 45 50 Q 30 30 25 18 Q 40 25 45 50', '#FFF') +
        path('M 45 50 Q 50 28 55 18 Q 50 25 45 50', '#FFF') +
        path('M 55 48 Q 70 28 75 18 Q 60 25 55 48', '#FFF') +
        path('M 55 48 Q 55 25 50 15 Q 55 25 55 48', '#FFF') +
        path('M 50 45 Q 42 22 38 12 Q 48 22 50 45', '#FFF') +
        // Stamens
        path('M 42 42 L 38 35', '#FFC107') +
        circle(38, 34, 1.5, '#FF8F00') +
        path('M 55 40 L 60 32', '#FFC107') +
        circle(60, 31, 1.5, '#FF8F00'),
      ['easter', 'lily', 'flower', 'holiday'],
      'Easter'
    )
  );

  // 8. Lamb
  blocks.push(
    block(
      'Easter Lamb',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        // Body (fluffy)
        circle(50, 55, 22, '#FAFAFA') +
        circle(38, 50, 10, '#F5F5F5') +
        circle(62, 50, 10, '#F5F5F5') +
        circle(42, 42, 8, '#FAFAFA') +
        circle(58, 42, 8, '#FAFAFA') +
        circle(50, 45, 12, '#F5F5F5') +
        // Head
        circle(72, 42, 10, '#FFF') +
        // Ear
        path('M 78 35 Q 85 30 82 38', '#FFB3B3') +
        // Eye
        circle(74, 40, 2, '#333') +
        // Nose
        circle(80, 44, 1.5, '#E91E63') +
        // Legs
        rect(38, 70, 5, 18, '#FFF') +
        rect(48, 72, 5, 16, '#FFF') +
        rect(55, 72, 5, 16, '#FFF') +
        rect(62, 70, 5, 18, '#FFF') +
        // Hooves
        rect(38, 86, 5, 4, '#333') +
        rect(48, 86, 5, 4, '#333') +
        rect(55, 86, 5, 4, '#333') +
        rect(62, 86, 5, 4, '#333'),
      ['easter', 'lamb', 'sheep', 'holiday'],
      'Easter'
    )
  );

  return blocks;
}

// ---------------------------------------------------------------------------
// July 4th (6)
// ---------------------------------------------------------------------------
function generateJuly4th(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];

  // 1. American Flag
  blocks.push(
    block(
      'American Flag',
      'Holiday',
      // Stripes
      rect(0, 0, 100, 100, '#FFF') +
        rect(0, 0, 100, 8, '#B71C1C') +
        rect(0, 15, 100, 8, '#B71C1C') +
        rect(0, 30, 100, 8, '#B71C1C') +
        rect(0, 46, 100, 8, '#B71C1C') +
        rect(0, 61, 100, 8, '#B71C1C') +
        rect(0, 77, 100, 8, '#B71C1C') +
        rect(0, 92, 100, 8, '#B71C1C') +
        // Blue canton
        rect(0, 0, 40, 54, '#1A237E') +
        // Stars (simplified grid)
        circle(8, 6, 2, '#FFF') +
        circle(20, 6, 2, '#FFF') +
        circle(32, 6, 2, '#FFF') +
        circle(14, 14, 2, '#FFF') +
        circle(26, 14, 2, '#FFF') +
        circle(8, 22, 2, '#FFF') +
        circle(20, 22, 2, '#FFF') +
        circle(32, 22, 2, '#FFF') +
        circle(14, 30, 2, '#FFF') +
        circle(26, 30, 2, '#FFF') +
        circle(8, 38, 2, '#FFF') +
        circle(20, 38, 2, '#FFF') +
        circle(32, 38, 2, '#FFF') +
        circle(14, 46, 2, '#FFF') +
        circle(26, 46, 2, '#FFF'),
      ['july 4th', 'flag', 'american', 'patriotic', 'holiday'],
      'July 4th'
    )
  );

  // 2. Firework - Red
  blocks.push(
    block(
      'Firework - Red',
      'Holiday',
      rect(0, 0, 100, 100, '#1A237E') +
        // Burst center
        circle(50, 40, 5, '#FFC107') +
        // Rays
        path('M 50 40 L 50 8', '#E53935') +
        path('M 50 40 L 50 72', '#E53935') +
        path('M 50 40 L 18 40', '#E53935') +
        path('M 50 40 L 82 40', '#E53935') +
        path('M 50 40 L 27 17', '#FF5252') +
        path('M 50 40 L 73 17', '#FF5252') +
        path('M 50 40 L 27 63', '#FF5252') +
        path('M 50 40 L 73 63', '#FF5252') +
        // Sparkle dots
        circle(50, 8, 3, '#FFC107') +
        circle(50, 72, 3, '#FFC107') +
        circle(18, 40, 3, '#FFC107') +
        circle(82, 40, 3, '#FFC107') +
        circle(27, 17, 3, '#FFC107') +
        circle(73, 17, 3, '#FFC107') +
        circle(27, 63, 3, '#FFC107') +
        circle(73, 63, 3, '#FFC107') +
        // Trail
        path('M 50 80 L 50 95', '#FF8A65'),
      ['july 4th', 'firework', 'celebration', 'holiday'],
      'July 4th'
    )
  );

  // 3. Firework - Blue
  blocks.push(
    block(
      'Firework - Blue',
      'Holiday',
      rect(0, 0, 100, 100, '#0D1B2A') +
        circle(50, 45, 4, '#FFF') +
        // Rays
        path('M 50 45 L 50 10', '#42A5F5') +
        path('M 50 45 L 50 80', '#42A5F5') +
        path('M 50 45 L 15 45', '#42A5F5') +
        path('M 50 45 L 85 45', '#42A5F5') +
        path('M 50 45 L 25 20', '#64B5F6') +
        path('M 50 45 L 75 20', '#64B5F6') +
        path('M 50 45 L 25 70', '#64B5F6') +
        path('M 50 45 L 75 70', '#64B5F6') +
        path('M 50 45 L 38 12', '#90CAF9') +
        path('M 50 45 L 62 12', '#90CAF9') +
        // Sparkle dots
        circle(50, 10, 2, '#FFF') +
        circle(50, 80, 2, '#FFF') +
        circle(15, 45, 2, '#FFF') +
        circle(85, 45, 2, '#FFF') +
        circle(25, 20, 2, '#FFF') +
        circle(75, 20, 2, '#FFF') +
        // Trail
        path('M 50 85 L 48 95', '#64B5F6'),
      ['july 4th', 'firework', 'blue', 'holiday'],
      'July 4th'
    )
  );

  // 4. Eagle
  blocks.push(
    block(
      'Eagle',
      'Holiday',
      rect(0, 0, 100, 100, '#E3F2FD') +
        // Body
        path('M 50 35 Q 40 50 38 65 Q 50 70 62 65 Q 60 50 50 35', '#5D4037') +
        // Head
        circle(50, 28, 10, '#FFF') +
        // Beak
        polygon('50,34 46,38 54,38', '#FFC107') +
        polygon('50,38 48,42 52,42', '#FFB300') +
        // Eye
        circle(47, 26, 2, '#333') +
        // Left wing
        path(
          'M 38 45 Q 15 30 5 45 Q 8 50 15 48 Q 10 55 5 58 Q 15 55 20 52 Q 15 60 12 65 Q 25 55 38 55',
          '#795548'
        ) +
        // Right wing
        path(
          'M 62 45 Q 85 30 95 45 Q 92 50 85 48 Q 90 55 95 58 Q 85 55 80 52 Q 85 60 88 65 Q 75 55 62 55',
          '#795548'
        ) +
        // Tail
        polygon('44,65 50,85 56,65', '#5D4037') +
        polygon('40,65 50,82 42,65', '#795548') +
        polygon('60,65 50,82 58,65', '#795548'),
      ['july 4th', 'eagle', 'patriotic', 'holiday'],
      'July 4th'
    )
  );

  // 5. Liberty Star
  blocks.push(
    block(
      'Liberty Star',
      'Holiday',
      rect(0, 0, 100, 100, '#1A237E') +
        // Outer star
        polygon(regularPolygonPoints(50, 50, 42, 5, -90), '#FFF') +
        polygon(regularPolygonPoints(50, 50, 42, 5, -90 + 36), '#1A237E') +
        // Inner star
        polygon(regularPolygonPoints(50, 50, 20, 5, -90), '#E53935') +
        polygon(regularPolygonPoints(50, 50, 20, 5, -90 + 36), '#1A237E') +
        // Center
        circle(50, 50, 6, '#FFC107'),
      ['july 4th', 'star', 'liberty', 'patriotic', 'holiday'],
      'July 4th'
    )
  );

  // 6. Uncle Sam Hat
  blocks.push(
    block(
      'Uncle Sam Hat',
      'Holiday',
      rect(0, 0, 100, 100, '#E3F2FD') +
        // Hat crown
        rect(30, 15, 40, 50, '#FFF') +
        // Blue band
        rect(30, 15, 40, 12, '#1A237E') +
        // Stars on band
        circle(40, 21, 2.5, '#FFF') +
        circle(50, 21, 2.5, '#FFF') +
        circle(60, 21, 2.5, '#FFF') +
        // Red stripes on crown
        rect(30, 30, 40, 5, '#B71C1C') +
        rect(30, 40, 40, 5, '#B71C1C') +
        rect(30, 50, 40, 5, '#B71C1C') +
        // Brim
        rect(15, 62, 70, 8, '#FFF') +
        rect(15, 62, 70, 2, '#E0E0E0'),
      ['july 4th', 'uncle sam', 'hat', 'patriotic', 'holiday'],
      'July 4th'
    )
  );

  return blocks;
}

// ---------------------------------------------------------------------------
// General Seasonal (8)
// ---------------------------------------------------------------------------
function generateSeasonal(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];

  // 1. Snowflake
  blocks.push(
    block(
      'Snowflake',
      'Holiday',
      rect(0, 0, 100, 100, '#E3F2FD') +
        // Main arms (6 directions)
        path('M 50 10 L 50 90', '#90CAF9') +
        path('M 15 30 L 85 70', '#90CAF9') +
        path('M 15 70 L 85 30', '#90CAF9') +
        // Branches on vertical arm
        path('M 50 25 L 40 20 M 50 25 L 60 20', '#64B5F6') +
        path('M 50 75 L 40 80 M 50 75 L 60 80', '#64B5F6') +
        // Branches on diagonal arms
        path('M 28 38 L 22 30 M 28 38 L 35 30', '#64B5F6') +
        path('M 72 62 L 78 70 M 72 62 L 65 70', '#64B5F6') +
        path('M 28 62 L 22 70 M 28 62 L 35 70', '#64B5F6') +
        path('M 72 38 L 78 30 M 72 38 L 65 30', '#64B5F6') +
        // Center
        circle(50, 50, 5, '#42A5F5') +
        // Tips
        circle(50, 10, 3, '#E3F2FD') +
        circle(50, 90, 3, '#E3F2FD') +
        circle(15, 30, 3, '#E3F2FD') +
        circle(85, 70, 3, '#E3F2FD') +
        circle(15, 70, 3, '#E3F2FD') +
        circle(85, 30, 3, '#E3F2FD'),
      ['winter', 'snowflake', 'snow', 'seasonal', 'holiday'],
      'General Seasonal'
    )
  );

  // 2. Autumn Leaf
  blocks.push(
    block(
      'Autumn Leaf',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.autumn.bg) +
        // Leaf shape
        path(
          'M 50 15 Q 80 25 85 50 Q 82 70 65 80 Q 50 88 35 80 Q 18 70 15 50 Q 20 25 50 15',
          '#E65100'
        ) +
        // Veins
        path('M 50 15 L 50 82', '#BF360C') +
        path('M 50 35 L 30 28', '#BF360C') +
        path('M 50 35 L 70 28', '#BF360C') +
        path('M 50 50 L 25 45', '#BF360C') +
        path('M 50 50 L 75 45', '#BF360C') +
        path('M 50 65 L 30 65', '#BF360C') +
        path('M 50 65 L 70 65', '#BF360C') +
        // Stem
        path('M 50 82 L 50 95', '#795548'),
      ['autumn', 'fall', 'leaf', 'seasonal', 'holiday'],
      'General Seasonal'
    )
  );

  // 3. Spring Flower
  blocks.push(
    block(
      'Spring Flower',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        // Stem
        rect(47, 55, 6, 40, '#388E3C') +
        // Leaves
        path('M 47 68 Q 28 60 22 70', '#4CAF50') +
        path('M 53 72 Q 72 64 78 74', '#4CAF50') +
        // Petals
        circle(50, 25, 12, '#E91E63') +
        circle(35, 38, 12, '#F48FB1') +
        circle(65, 38, 12, '#F48FB1') +
        circle(38, 52, 12, '#E91E63') +
        circle(62, 52, 12, '#E91E63') +
        // Center
        circle(50, 40, 8, '#FFC107'),
      ['spring', 'flower', 'bloom', 'seasonal', 'holiday'],
      'General Seasonal'
    )
  );

  // 4. Summer Sun
  blocks.push(
    block(
      'Summer Sun',
      'Holiday',
      rect(0, 0, 100, 100, '#87CEEB') +
        // Rays (triangular)
        polygon('50,5 44,20 56,20', '#FFB300') +
        polygon('50,80 44,65 56,65', '#FFB300') +
        polygon('5,42 20,38 20,46', '#FFB300') +
        polygon('80,42 65,38 65,46', '#FFB300') +
        polygon('17,15 28,22 22,28', '#FFC107') +
        polygon('78,22 72,28 83,15', '#FFC107') +
        polygon('17,70 28,63 22,57', '#FFC107') +
        polygon('83,70 72,63 78,57', '#FFC107') +
        // Sun face
        circle(50, 42, 22, '#FFC107') +
        // Eyes
        circle(42, 38, 3, '#5D4037') +
        circle(58, 38, 3, '#5D4037') +
        // Smile
        path('M 40 48 Q 50 55 60 48', '#5D4037') +
        // Cheeks
        circle(36, 46, 3, '#FFAB91') +
        circle(64, 46, 3, '#FFAB91'),
      ['summer', 'sun', 'sunshine', 'seasonal', 'holiday'],
      'General Seasonal'
    )
  );

  // 5. Winter Mittens
  blocks.push(
    block(
      'Winter Mittens',
      'Holiday',
      rect(0, 0, 100, 100, '#E3F2FD') +
        // Left mitten
        path('M 15 40 Q 12 25 20 20 L 35 20 Q 42 25 40 40 L 40 65 Q 28 70 15 65 Z', '#E53935') +
        path('M 15 40 Q 8 35 10 28 Q 14 25 15 32', '#C62828') +
        rect(15, 55, 25, 5, '#FFF') +
        // Right mitten
        path('M 60 40 Q 58 25 65 20 L 80 20 Q 88 25 85 40 L 85 65 Q 72 70 60 65 Z', '#2E7D32') +
        path('M 85 40 Q 92 35 90 28 Q 86 25 85 32', '#1B5E20') +
        rect(60, 55, 25, 5, '#FFF') +
        // String connecting them
        path('M 28 20 Q 50 5 72 20', '#9E9E9E') +
        // Snowflakes
        circle(50, 45, 2, '#FFF') +
        circle(48, 80, 1.5, '#FFF') +
        circle(55, 75, 1, '#FFF'),
      ['winter', 'mittens', 'cold', 'seasonal', 'holiday'],
      'General Seasonal'
    )
  );

  // 6. Spring Rain
  blocks.push(
    block(
      'Spring Rain',
      'Holiday',
      rect(0, 0, 100, 100, '#E0E0E0') +
        // Cloud
        circle(35, 22, 15, '#BDBDBD') +
        circle(55, 18, 18, '#BDBDBD') +
        circle(70, 24, 13, '#BDBDBD') +
        rect(22, 22, 60, 14, '#BDBDBD') +
        // Raindrops
        path('M 25 48 Q 23 42 25 38 Q 27 42 25 48', '#42A5F5') +
        path('M 40 55 Q 38 49 40 45 Q 42 49 40 55', '#42A5F5') +
        path('M 55 50 Q 53 44 55 40 Q 57 44 55 50', '#42A5F5') +
        path('M 70 52 Q 68 46 70 42 Q 72 46 70 52', '#42A5F5') +
        path('M 32 68 Q 30 62 32 58 Q 34 62 32 68', '#64B5F6') +
        path('M 48 72 Q 46 66 48 62 Q 50 66 48 72', '#64B5F6') +
        path('M 62 66 Q 60 60 62 56 Q 64 60 62 66', '#64B5F6') +
        // Puddle
        path('M 20 90 Q 50 85 80 90 Q 50 95 20 90', '#90CAF9'),
      ['spring', 'rain', 'weather', 'seasonal', 'holiday'],
      'General Seasonal'
    )
  );

  // 7. Harvest Moon
  blocks.push(
    block(
      'Harvest Moon',
      'Holiday',
      rect(0, 0, 100, 100, '#1A237E') +
        // Moon
        circle(50, 40, 25, '#FF8F00') +
        circle(42, 35, 4, '#E65100') +
        circle(55, 42, 3, '#E65100') +
        circle(48, 48, 2, '#E65100') +
        // Silhouette horizon
        rect(0, 75, 100, 25, '#333') +
        // Corn stalks silhouette
        path('M 15 75 L 15 55 L 18 50 L 15 55 L 12 50', '#333') +
        path('M 30 75 L 30 60 L 33 55 L 30 60 L 27 55', '#333') +
        path('M 75 75 L 75 58 L 78 53 L 75 58 L 72 53', '#333') +
        path('M 88 75 L 88 62 L 91 57 L 88 62 L 85 57', '#333') +
        // Stars
        circle(15, 15, 1.5, '#FFF') +
        circle(85, 20, 1, '#FFF') +
        circle(78, 12, 1.5, '#FFF') +
        circle(25, 60, 1, '#FFF'),
      ['autumn', 'harvest', 'moon', 'seasonal', 'holiday'],
      'General Seasonal'
    )
  );

  // 8. Spring Butterfly
  blocks.push(
    block(
      'Spring Butterfly',
      'Holiday',
      rect(0, 0, 100, 100, PALETTES.spring.bg) +
        // Body
        rect(47, 30, 6, 40, '#5D4037') +
        // Head
        circle(50, 28, 5, '#5D4037') +
        // Antennae
        path('M 48 24 Q 35 10 30 8', '#5D4037') +
        path('M 52 24 Q 65 10 70 8', '#5D4037') +
        circle(30, 8, 2, '#5D4037') +
        circle(70, 8, 2, '#5D4037') +
        // Upper left wing
        path('M 47 35 Q 15 15 10 35 Q 8 50 47 50', '#E91E63') +
        circle(25, 35, 6, '#F48FB1') +
        // Upper right wing
        path('M 53 35 Q 85 15 90 35 Q 92 50 53 50', '#E91E63') +
        circle(75, 35, 6, '#F48FB1') +
        // Lower left wing
        path('M 47 50 Q 15 50 12 65 Q 15 78 47 65', '#FF9800') +
        circle(28, 62, 4, '#FFB74D') +
        // Lower right wing
        path('M 53 50 Q 85 50 88 65 Q 85 78 53 65', '#FF9800') +
        circle(72, 62, 4, '#FFB74D'),
      ['spring', 'butterfly', 'insect', 'seasonal', 'holiday'],
      'General Seasonal'
    )
  );

  return blocks;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function generateHolidayBlocks(): BlockDefinition[] {
  return [
    ...generateChristmas(),
    ...generateHalloween(),
    ...generateThanksgiving(),
    ...generateValentines(),
    ...generateEaster(),
    ...generateJuly4th(),
    ...generateSeasonal(),
  ];
}
