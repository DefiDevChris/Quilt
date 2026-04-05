/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '/home/chrishoran/Desktop/Quilt/quilt-block-images';

const blocks = [
  {
    num: 1,
    name: 'Nine Patch',
    slug: '9-patch-quilt-block',
    search: 'Nine Patch quilt block diagram',
  },
  {
    num: 2,
    name: 'Churn Dash',
    slug: 'churn-dash-quilt-block',
    search: 'Churn Dash quilt block diagram',
  },
  {
    num: 3,
    name: 'Log Cabin',
    slug: 'log-cabin-quilt-block',
    search: 'Log Cabin quilt block diagram',
  },
  {
    num: 4,
    name: 'Ohio Star',
    slug: 'ohio-star-quilt-block',
    search: 'Ohio Star quilt block diagram',
  },
  {
    num: 5,
    name: 'Bear Paw',
    slug: 'bears-paw-quilt-block',
    search: 'Bear Paw quilt block diagram',
  },
  {
    num: 6,
    name: 'Pinwheel',
    slug: 'pinwheel-quilt-block',
    search: 'Pinwheel quilt block diagram',
  },
  {
    num: 7,
    name: 'Flying Geese',
    slug: 'flying-geese-units',
    search: 'Flying Geese quilt block diagram',
  },
  {
    num: 8,
    name: 'Drunkards Path',
    slug: 'drunkards-path-quilt-block',
    search: 'Drunkards Path quilt block diagram',
  },
  { num: 9, name: 'Shoo Fly', slug: 'shoofly-quilt-block', search: 'Shoo Fly quilt block diagram' },
  {
    num: 10,
    name: 'Sawtooth Star',
    slug: 'sawtooth-quilt-block',
    search: 'Sawtooth Star quilt block diagram',
  },
  {
    num: 11,
    name: 'Friendship Star',
    slug: 'friendship-star-quilt-block',
    search: 'Friendship Star quilt block diagram',
  },
  {
    num: 12,
    name: 'Square in a Square',
    slug: 'square-in-a-square',
    search: 'Square in a Square quilt block diagram',
  },
  {
    num: 13,
    name: 'Rail Fence',
    slug: 'rail-fence-block-unit',
    search: 'Rail Fence quilt block diagram',
  },
  {
    num: 14,
    name: 'Card Trick',
    slug: 'card-trick-quilt-block',
    search: 'Card Trick quilt block diagram',
  },
  {
    num: 15,
    name: 'Double Star',
    slug: 'double-star-quilt-block',
    search: 'Double Star quilt block diagram',
  },
  {
    num: 16,
    name: 'Lone Star',
    slug: 'lone-star-quilt-block',
    search: 'Lone Star quilt block diagram',
  },
  {
    num: 17,
    name: 'Tumbling Blocks',
    slug: 'tumbling-blocks-quilt-block',
    search: 'Tumbling Blocks quilt block diagram',
  },
  {
    num: 18,
    name: 'Dresden Plate',
    slug: 'dresden-plate-quilt-block',
    search: 'Dresden Plate quilt block diagram',
  },
  {
    num: 19,
    name: 'Irish Chain',
    slug: 'double-irish-chain-quilt-block',
    search: 'Irish Chain quilt block diagram',
  },
  {
    num: 20,
    name: 'HST',
    slug: 'half-square-triangle',
    search: 'Half Square Triangle quilt block diagram',
  },
  { num: 21, name: 'Four Patch', slug: '4-patch-unit', search: 'Four Patch quilt block diagram' },
  {
    num: 22,
    name: 'Double Four Patch',
    slug: 'double-four-patch-quilt-block',
    search: 'Double Four Patch quilt block diagram',
  },
  {
    num: 23,
    name: 'Snowball',
    slug: 'snowball-quilt-block',
    search: 'Snowball quilt block diagram',
  },
  { num: 24, name: 'Bow Tie', slug: 'bowtie-quilt-block', search: 'Bow Tie quilt block diagram' },
  {
    num: 25,
    name: 'Windmill',
    slug: 'windmill-quilt-block',
    search: 'Windmill quilt block diagram',
  },
  {
    num: 26,
    name: 'Hourglass',
    slug: 'hourglass-quilt-block',
    search: 'Hourglass quilt block diagram',
  },
  {
    num: 27,
    name: 'Broken Dishes',
    slug: 'broken-dishes-quilt-block',
    search: 'Broken Dishes quilt block diagram',
  },
  {
    num: 28,
    name: 'Variable Star',
    slug: 'variable-star-quilt-block',
    search: 'Variable Star quilt block diagram',
  },
  {
    num: 29,
    name: 'Evening Star',
    slug: 'evening-star-quilt-block',
    search: 'Evening Star quilt block diagram',
  },
  {
    num: 30,
    name: 'North Star',
    slug: 'north-star-quilt-block',
    search: 'North Star quilt block diagram',
  },
  {
    num: 31,
    name: 'Maple Leaf',
    slug: 'maple-leaf-quilt-block',
    search: 'Maple Leaf quilt block diagram',
  },
  { num: 32, name: 'Basket', slug: 'basket-quilt-block', search: 'Basket quilt block diagram' },
  {
    num: 33,
    name: 'Grandmothers Fan',
    slug: 'grandmothers-fan-quilt-block',
    search: 'Grandmothers Fan quilt block diagram',
  },
  {
    num: 34,
    name: 'Economy Block',
    slug: 'economy-quilt-block',
    search: 'Economy Block quilt block diagram',
  },
  {
    num: 35,
    name: 'Yankee Puzzle',
    slug: 'yankee-puzzle-quilt-block',
    search: 'Yankee Puzzle quilt block diagram',
  },
  {
    num: 36,
    name: 'Dutchmans Puzzle',
    slug: 'dutchmans-puzzle-quilt-block',
    search: 'Dutchmans Puzzle quilt block diagram',
  },
  {
    num: 37,
    name: 'Weather Vane',
    slug: 'weathervane-quilt-block',
    search: 'Weather Vane quilt block diagram',
  },
  { num: 38, name: 'Anvil', slug: 'anvil-quilt-block', search: 'Anvil quilt block diagram' },
  {
    num: 39,
    name: 'Puss in the Corner',
    slug: 'puss-in-the-corner-quilt-block',
    search: 'Puss in the Corner quilt block diagram',
  },
  {
    num: 40,
    name: 'Corn and Beans',
    slug: 'corn-and-beans-quilt-block',
    search: 'Corn and Beans quilt block diagram',
  },
  {
    num: 41,
    name: 'Gentlemans Fancy',
    slug: 'gentlemans-fancy-quilt-block',
    search: 'Gentlemans Fancy quilt block diagram',
  },
  {
    num: 42,
    name: 'Jacobs Ladder',
    slug: 'jacobs-ladder-quilt-block',
    search: 'Jacobs Ladder quilt block diagram',
  },
  {
    num: 43,
    name: 'Monkey Wrench',
    slug: 'monkey-wrench-quilt-block',
    search: 'Monkey Wrench quilt block diagram',
  },
  {
    num: 44,
    name: 'Courthouse Steps',
    slug: 'courthouse-steps-quilt-block',
    search: 'Courthouse Steps quilt block diagram',
  },
  {
    num: 45,
    name: 'Attic Windows',
    slug: 'attic-window',
    search: 'Attic Windows quilt block diagram',
  },
  {
    num: 46,
    name: 'Crosses and Losses',
    slug: 'crosses-and-losses-quilt-block',
    search: 'Crosses and Losses quilt block diagram',
  },
  {
    num: 47,
    name: 'Goose Tracks',
    slug: 'goose-tracks-quilt-block',
    search: 'Goose Tracks quilt block diagram',
  },
  {
    num: 48,
    name: 'Handy Andy',
    slug: 'handy-andy-quilt-block',
    search: 'Handy Andy quilt block diagram',
  },
  {
    num: 49,
    name: 'Old Maids Puzzle',
    slug: 'old-maids-puzzle-quilt-block',
    search: 'Old Maids Puzzle quilt block diagram',
  },
  {
    num: 50,
    name: 'Road to Oklahoma',
    slug: 'road-to-oklahoma-quilt-block',
    search: 'Road to Oklahoma quilt block diagram',
  },
  {
    num: 51,
    name: 'Double Nine Patch',
    slug: 'double-nine-patch-quilt-block',
    search: 'Double Nine Patch quilt block diagram',
  },
  {
    num: 52,
    name: 'Disappearing Nine Patch',
    slug: 'disappearing-nine-patch-quilt-block',
    search: 'Disappearing Nine Patch quilt block diagram',
  },
  {
    num: 53,
    name: 'Split Nine Patch',
    slug: 'split-nine-patch-quilt-block',
    search: 'Split Nine Patch quilt block diagram',
  },
  {
    num: 54,
    name: 'Five Patch',
    slug: 'five-patch-quilt-block',
    search: 'Five Patch quilt block diagram',
  },
  { num: 55, name: 'T-Block', slug: 't-block-quilt-block', search: 'T Block quilt block diagram' },
  {
    num: 56,
    name: 'Spider Web',
    slug: 'spider-web-quilt-block',
    search: 'Spider Web quilt block diagram',
  },
  {
    num: 57,
    name: 'Kaleidoscope',
    slug: 'kaleidoscope-quilt-block',
    search: 'Kaleidoscope quilt block diagram',
  },
  { num: 58, name: 'Mosaic', slug: 'mosaic-quilt-block', search: 'Mosaic quilt block diagram' },
  {
    num: 59,
    name: 'Roman Stripe',
    slug: 'roman-stripe-quilt-block',
    search: 'Roman Stripe quilt block diagram',
  },
  {
    num: 60,
    name: 'Chinese Coins',
    slug: 'chinese-coins-quilt-block',
    search: 'Chinese Coins quilt block diagram',
  },
  {
    num: 61,
    name: 'Snails Trail',
    slug: 'snails-trail-quilt-block',
    search: 'Snails Trail quilt block diagram',
  },
  {
    num: 62,
    name: 'Storm at Sea',
    slug: 'storm-at-sea-quilt-block',
    search: 'Storm at Sea quilt block diagram',
  },
  {
    num: 63,
    name: 'Carpenters Star',
    slug: 'carpenters-star-quilt-block',
    search: 'Carpenters Star quilt block diagram',
  },
  {
    num: 64,
    name: 'LeMoyne Star',
    slug: 'lemoyne-star-quilt-block',
    search: 'LeMoyne Star quilt block diagram',
  },
  {
    num: 65,
    name: 'Morning Star',
    slug: 'morning-star-quilt-block',
    search: 'Morning Star quilt block diagram',
  },
  {
    num: 66,
    name: 'Hunters Star',
    slug: 'hunters-star-quilt-block',
    search: 'Hunters Star quilt block diagram',
  },
  {
    num: 67,
    name: 'Prairie Star',
    slug: 'prairie-star-quilt-block',
    search: 'Prairie Star quilt block diagram',
  },
  {
    num: 68,
    name: 'Rolling Star',
    slug: 'rolling-star-quilt-block',
    search: 'Rolling Star quilt block diagram',
  },
  {
    num: 69,
    name: 'Blazing Star',
    slug: 'blazing-star-quilt-block',
    search: 'Blazing Star quilt block diagram',
  },
  {
    num: 70,
    name: 'Mexican Star',
    slug: 'mexican-star-quilt-block',
    search: 'Mexican Star quilt block diagram',
  },
  {
    num: 71,
    name: 'Cathedral Star',
    slug: 'cathedral-star-quilt-block',
    search: 'Cathedral Star quilt block diagram',
  },
  {
    num: 72,
    name: 'Broken Star',
    slug: 'broken-star-quilt-block',
    search: 'Broken Star quilt block diagram',
  },
  {
    num: 73,
    name: 'Star of Bethlehem',
    slug: 'star-of-bethlehem-quilt-block',
    search: 'Star of Bethlehem quilt block diagram',
  },
  {
    num: 74,
    name: 'Mariners Compass',
    slug: 'mariners-compass-quilt-block',
    search: 'Mariners Compass quilt block diagram',
  },
  {
    num: 75,
    name: 'Ocean Waves',
    slug: 'ocean-waves-quilt-block',
    search: 'Ocean Waves quilt block diagram',
  },
  {
    num: 76,
    name: 'Steps to the Altar',
    slug: 'steps-to-the-altar-quilt-block',
    search: 'Steps to the Altar quilt block diagram',
  },
  {
    num: 77,
    name: 'Spinning Top',
    slug: 'spinning-top-quilt-block',
    search: 'Spinning Top quilt block diagram',
  },
  {
    num: 78,
    name: 'Winged Square',
    slug: 'winged-square-quilt-block',
    search: 'Winged Square quilt block diagram',
  },
  {
    num: 79,
    name: 'Cross and Crown',
    slug: 'cross-and-crown-quilt-block',
    search: 'Cross and Crown quilt block diagram',
  },
  {
    num: 80,
    name: 'Devils Claw',
    slug: 'devils-claw-quilt-block',
    search: 'Devils Claw quilt block diagram',
  },
  {
    num: 81,
    name: 'Whirlwind',
    slug: 'whirlwind-quilt-block',
    search: 'Whirlwind quilt block diagram',
  },
  {
    num: 82,
    name: 'Double Pinwheel',
    slug: 'double-pinwheel-quilt-block',
    search: 'Double Pinwheel quilt block diagram',
  },
  { num: 83, name: 'Chevron', slug: 'chevron-quilt-block', search: 'Chevron quilt block diagram' },
  {
    num: 84,
    name: 'Schoolhouse',
    slug: 'schoolhouse-quilt-block',
    search: 'Schoolhouse quilt block diagram',
  },
  {
    num: 85,
    name: 'Pine Tree',
    slug: 'pine-tree-quilt-block',
    search: 'Pine Tree quilt block diagram',
  },
  {
    num: 86,
    name: 'Tree of Life',
    slug: 'tree-of-life-quilt-block',
    search: 'Tree of Life quilt block diagram',
  },
  {
    num: 87,
    name: 'Sunflower',
    slug: 'sunflower-quilt-block',
    search: 'Sunflower quilt block diagram',
  },
  {
    num: 88,
    name: 'Tulip Block',
    slug: 'tulip-block-quilt-block',
    search: 'Tulip Block quilt block diagram',
  },
  {
    num: 89,
    name: 'Carolina Lily',
    slug: 'carolina-lily-quilt-block',
    search: 'Carolina Lily quilt block diagram',
  },
  {
    num: 90,
    name: 'Cactus Basket',
    slug: 'cactus-basket-quilt-block',
    search: 'Cactus Basket quilt block diagram',
  },
  {
    num: 91,
    name: 'Butterfly',
    slug: 'butterfly-quilt-block',
    search: 'Butterfly quilt block diagram',
  },
  { num: 92, name: 'Lily', slug: 'lily-quilt-block', search: 'Lily quilt block diagram' },
  {
    num: 93,
    name: 'Pineapple',
    slug: 'pineapple-quilt-block',
    search: 'Pineapple quilt block diagram',
  },
  {
    num: 94,
    name: 'Zigzag',
    slug: 'london-steps-quilt-block',
    search: 'Zigzag quilt block diagram',
  },
  {
    num: 95,
    name: 'Herringbone',
    slug: 'herringbone-quilt-block',
    search: 'Herringbone quilt block diagram',
  },
  { num: 96, name: 'Bricks', slug: 'brickwork-quilt-block', search: 'Bricks quilt block diagram' },
  {
    num: 97,
    name: 'Trip Around the World',
    slug: 'trip-around-the-world-quilt-block',
    search: 'Trip Around the World quilt block diagram',
  },
  {
    num: 98,
    name: 'Cathedral Windows',
    slug: 'cathedral-windows-quilt-block',
    search: 'Cathedral Windows quilt block diagram',
  },
  {
    num: 99,
    name: 'Double Wedding Ring',
    slug: 'double-wedding-ring-quilt-block',
    search: 'Double Wedding Ring quilt block diagram',
  },
  {
    num: 100,
    name: 'Grandmothers Flower Garden',
    slug: 'grandmothers-flower-garden-quilt-block',
    search: 'Grandmothers Flower Garden quilt block diagram',
  },
  {
    num: 101,
    name: 'Crown Royal',
    slug: 'crown-royal-quilt-block',
    search: 'Crown Royal quilt block diagram',
  },
  {
    num: 102,
    name: 'Rose of Sharon',
    slug: 'rose-of-sharon-block',
    search: 'Rose of Sharon quilt block diagram',
  },
  {
    num: 103,
    name: 'Bargello Strip',
    slug: 'bargello-quilt-block',
    search: 'Bargello Strip quilt block diagram',
  },
  {
    num: 104,
    name: 'Dove at the Window',
    slug: 'dove-in-a-window-quilt-block',
    search: 'Dove at the Window quilt block diagram',
  },
  {
    num: 105,
    name: 'Grandmothers Choice',
    slug: 'grandmothers-choice-quilt-block',
    search: 'Grandmothers Choice quilt block diagram',
  },
];

async function screenshotBlock(page, block) {
  const padded = String(block.num).padStart(3, '0');
  const filename = `${padded}-${block.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);

  if (fs.existsSync(filepath) && fs.statSync(filepath).size > 5000) {
    return { num: block.num, name: block.name, status: 'SKIP', file: filename };
  }

  // Strategy 1: Try Scissortail Quilting
  const scissorUrl = `https://scissortailquilting.com/quilt-block-library/${block.slug}/`;
  try {
    await page.goto(scissorUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Find the main block diagram image (not header/logo images)
    const blockImg = await page.$(
      'article img[src*="wp-content"], .entry-content img[src*="wp-content"]'
    );
    if (blockImg) {
      const src = await blockImg.getAttribute('src');
      // Skip tiny/thumbnail images
      const bbox = await blockImg.boundingBox();
      if (bbox && bbox.width > 100 && bbox.height > 100) {
        await blockImg.screenshot({ path: filepath });
        const size = fs.statSync(filepath).size;
        if (size > 5000) {
          return { num: block.num, name: block.name, status: `SCISSOR (${size}B)`, file: filename };
        }
      }
    }

    // Try any large image in the article
    const allImgs = await page.$$('article img, .entry-content img');
    for (const img of allImgs) {
      const bbox = await img.boundingBox();
      if (bbox && bbox.width > 150 && bbox.height > 150) {
        await img.screenshot({ path: filepath });
        const size = fs.statSync(filepath).size;
        if (size > 5000) {
          return {
            num: block.num,
            name: block.name,
            status: `SCISSOR-ALT (${size}B)`,
            file: filename,
          };
        }
      }
    }

    // Fallback: screenshot the article content area
    const article = await page.$('article');
    if (article) {
      await article.screenshot({ path: filepath });
      const size = fs.statSync(filepath).size;
      if (size > 5000) {
        return {
          num: block.num,
          name: block.name,
          status: `SCISSOR-ARTICLE (${size}B)`,
          file: filename,
        };
      }
    }
  } catch (e) {
    // Page failed, try next strategy
  }

  // Strategy 2: Search and screenshot Wikipedia
  try {
    await page.goto(
      `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(block.search + ' quilt block')}`,
      { waitUntil: 'domcontentloaded', timeout: 10000 }
    );
    await page.waitForTimeout(1000);

    // Check if there's a direct article
    const firstResult = await page.$('.mw-search-result a');
    if (firstResult) {
      const href = await firstResult.getAttribute('href');
      if (href && href.includes('/wiki/')) {
        await page.goto(`https://en.wikipedia.org${href}`, {
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        });
        await page.waitForTimeout(1500);

        // Screenshot the infobox image or first content image
        const infoboxImg = await page.$('.infobox img');
        if (infoboxImg) {
          await infoboxImg.screenshot({ path: filepath });
          const size = fs.statSync(filepath).size;
          if (size > 3000) {
            return { num: block.num, name: block.name, status: `WIKI (${size}B)`, file: filename };
          }
        }

        // Any content image
        const contentImg = await page.$('.mw-parser-output img');
        if (contentImg) {
          await contentImg.screenshot({ path: filepath });
          const size = fs.statSync(filepath).size;
          if (size > 3000) {
            return {
              num: block.num,
              name: block.name,
              status: `WIKI-IMG (${size}B)`,
              file: filename,
            };
          }
        }

        // Full page screenshot
        await page.screenshot({ path: filepath, fullPage: false });
        return { num: block.num, name: block.name, status: `WIKI-PAGE`, file: filename };
      }
    }
  } catch (e) {
    // Wikipedia failed
  }

  // Strategy 3: Full page screenshot of Scissortail
  try {
    await page.goto(scissorUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: filepath, fullPage: false });
    return { num: block.num, name: block.name, status: 'FULL-PAGE', file: filename };
  } catch (e) {
    return {
      num: block.num,
      name: block.name,
      status: `FAILED: ${e.message.substring(0, 60)}`,
      file: filename,
    };
  }
}

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const results = [];
  let completed = 0;

  for (const block of blocks) {
    const result = await screenshotBlock(page, block);
    results.push(result);
    completed++;
    console.log(
      `${completed}/105: ${result.name.padEnd(30)} ${result.status.padEnd(25)} ${result.file}`
    );
  }

  console.log('\n=== SUMMARY ===');
  const byStatus = {};
  results.forEach((r) => {
    const status = r.status.split(' ')[0];
    byStatus[status] = (byStatus[status] || 0) + 1;
  });
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  const failed = results.filter((r) => r.status.startsWith('FAILED'));
  if (failed.length > 0) {
    console.log('\nFailed blocks:');
    failed.forEach((r) => console.log(`  ${r.num}. ${r.name}: ${r.status}`));
  }

  await browser.close();
  console.log('\nDone!');
})();
