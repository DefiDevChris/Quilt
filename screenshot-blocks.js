/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');

// Map of block numbers to their URL slugs on generations-quilt-patterns.com
const blocks = [
  // Original 20 (1-20)
  { num: 1, name: 'Nine Patch', slug: 'nine-patch' },
  { num: 2, name: 'Churn Dash', slug: 'churn-dash' },
  { num: 3, name: 'Log Cabin', slug: 'log-cabin' },
  { num: 4, name: 'Ohio Star', slug: 'ohio-star' },
  { num: 5, name: 'Bear Paw', slug: 'bears-paw' },
  { num: 6, name: 'Pinwheel', slug: 'pinwheel' },
  { num: 7, name: 'Flying Geese', slug: 'flying-geese' },
  { num: 8, name: 'Drunkards Path', slug: 'drunkards-path' },
  { num: 9, name: 'Shoo Fly', slug: 'shoofly' },
  { num: 10, name: 'Sawtooth Star', slug: 'sawtooth' },
  { num: 11, name: 'Friendship Star', slug: 'friendship-star' },
  { num: 12, name: 'Square in a Square', slug: 'square-in-a-square' },
  { num: 13, name: 'Rail Fence', slug: 'rail-fence' },
  { num: 14, name: 'Card Trick', slug: 'card-trick' },
  { num: 15, name: 'Double Star', slug: 'double-star' },
  { num: 16, name: 'Lone Star', slug: 'lone-star' },
  { num: 17, name: 'Tumbling Blocks', slug: 'tumbling-blocks' },
  { num: 18, name: 'Dresden Plate', slug: 'dresden-plate' },
  { num: 19, name: 'Irish Chain', slug: 'irish-chain' },
  { num: 20, name: 'HST', slug: 'half-square-triangle' },
  // Batch 1 (21-41)
  { num: 21, name: 'Four Patch', slug: 'four-patch' },
  { num: 22, name: 'Double Four Patch', slug: 'double-four-patch' },
  { num: 23, name: 'Snowball', slug: 'snowball' },
  { num: 24, name: 'Bow Tie', slug: 'bowtie' },
  { num: 25, name: 'Windmill', slug: 'windmill' },
  { num: 26, name: 'Hourglass', slug: 'hourglass' },
  { num: 27, name: 'Broken Dishes', slug: 'broken-dishes' },
  { num: 28, name: 'Variable Star', slug: 'variable-star' },
  { num: 29, name: 'Evening Star', slug: 'evening-star' },
  { num: 30, name: 'North Star', slug: 'north-star' },
  { num: 31, name: 'Maple Leaf', slug: 'maple-leaf' },
  { num: 32, name: 'Basket', slug: 'basket' },
  { num: 33, name: 'Grandmothers Fan', slug: 'grandmothers-fan' },
  { num: 34, name: 'Economy Block', slug: 'economy' },
  { num: 35, name: 'Yankee Puzzle', slug: 'yankee-puzzle' },
  { num: 36, name: 'Dutchmans Puzzle', slug: 'dutchmans-puzzle' },
  { num: 37, name: 'Weather Vane', slug: 'weathervane' },
  { num: 38, name: 'Anvil', slug: 'anvil' },
  { num: 39, name: 'Puss in the Corner', slug: 'puss-in-the-corner' },
  { num: 40, name: 'Corn and Beans', slug: 'corn-and-beans' },
  { num: 41, name: 'Gentlemans Fancy', slug: 'gentlemans-fancy' },
  // Batch 2 (42-62)
  { num: 42, name: 'Jacobs Ladder', slug: 'jacob-ladder' },
  { num: 43, name: 'Monkey Wrench', slug: 'monkey-wrench' },
  { num: 44, name: 'Courthouse Steps', slug: 'courthouse-steps' },
  { num: 45, name: 'Attic Windows', slug: 'attic-window' },
  { num: 46, name: 'Crosses and Losses', slug: 'crosses-and-losses' },
  { num: 47, name: 'Goose Tracks', slug: 'goose-tracks' },
  { num: 48, name: 'Handy Andy', slug: 'handy-andy' },
  { num: 49, name: 'Old Maids Puzzle', slug: 'old-maids-puzzle' },
  { num: 50, name: 'Road to Oklahoma', slug: 'road-to-oklahoma' },
  { num: 51, name: 'Double Nine Patch', slug: 'double-nine-patch' },
  { num: 52, name: 'Disappearing Nine Patch', slug: 'disappearing-nine-patch' },
  { num: 53, name: 'Split Nine Patch', slug: 'split-nine-patch' },
  { num: 54, name: 'Five Patch', slug: 'five-patch' },
  { num: 55, name: 'T-Block', slug: 't-block' },
  { num: 56, name: 'Spider Web', slug: 'spider-web' },
  { num: 57, name: 'Kaleidoscope', slug: 'kaleidoscope' },
  { num: 58, name: 'Mosaic', slug: 'mosaic' },
  { num: 59, name: 'Roman Stripe', slug: 'roman-stripe' },
  { num: 60, name: 'Chinese Coins', slug: 'chinese-coins' },
  { num: 61, name: 'Snails Trail', slug: 'snails-trail' },
  { num: 62, name: 'Storm at Sea', slug: 'storm-at-sea' },
  // Batch 3 (63-83)
  { num: 63, name: 'Carpenters Star', slug: 'carpenters-star' },
  { num: 64, name: 'LeMoyne Star', slug: 'lemoyne-star' },
  { num: 65, name: 'Morning Star', slug: 'morning-star' },
  { num: 66, name: 'Hunters Star', slug: 'hunters-star' },
  { num: 67, name: 'Prairie Star', slug: 'prairie-star' },
  { num: 68, name: 'Rolling Star', slug: 'rolling-star' },
  { num: 69, name: 'Blazing Star', slug: 'blazing-star' },
  { num: 70, name: 'Mexican Star', slug: 'mexican-star' },
  { num: 71, name: 'Cathedral Star', slug: 'cathedral-star' },
  { num: 72, name: 'Broken Star', slug: 'broken-star' },
  { num: 73, name: 'Star of Bethlehem', slug: 'star-of-bethlehem' },
  { num: 74, name: 'Mariners Compass', slug: 'mariners-compass' },
  { num: 75, name: 'Ocean Waves', slug: 'ocean-waves' },
  { num: 76, name: 'Steps to the Altar', slug: 'steps-to-the-altar' },
  { num: 77, name: 'Spinning Top', slug: 'spinning-top' },
  { num: 78, name: 'Winged Square', slug: 'winged-square' },
  { num: 79, name: 'Cross and Crown', slug: 'cross-and-crown' },
  { num: 80, name: 'Devils Claw', slug: 'devils-claw' },
  { num: 81, name: 'Whirlwind', slug: 'whirlwind' },
  { num: 82, name: 'Double Pinwheel', slug: 'double-pinwheel' },
  { num: 83, name: 'Chevron', slug: 'chevron' },
  // Batch 4 (84-105)
  { num: 84, name: 'Schoolhouse', slug: 'schoolhouse' },
  { num: 85, name: 'Pine Tree', slug: 'pine-tree' },
  { num: 86, name: 'Tree of Life', slug: 'tree-of-life' },
  { num: 87, name: 'Sunflower', slug: 'sunflower' },
  { num: 88, name: 'Tulip Block', slug: 'tulip-block' },
  { num: 89, name: 'Carolina Lily', slug: 'carolina-lily' },
  { num: 90, name: 'Cactus Basket', slug: 'cactus-basket' },
  { num: 91, name: 'Butterfly', slug: 'butterfly' },
  { num: 92, name: 'Lily', slug: 'lily' },
  { num: 93, name: 'Pineapple', slug: 'pineapple' },
  { num: 94, name: 'Zigzag', slug: 'zigzag' },
  { num: 95, name: 'Herringbone', slug: 'herringbone' },
  { num: 96, name: 'Bricks', slug: 'bricks' },
  { num: 97, name: 'Trip Around the World', slug: 'trip-around-the-world' },
  { num: 98, name: 'Cathedral Windows', slug: 'cathedral-windows' },
  { num: 99, name: 'Double Wedding Ring', slug: 'double-wedding-ring' },
  { num: 100, name: 'Grandmothers Flower Garden', slug: 'grandmothers-flower-garden' },
  { num: 101, name: 'Crown Royal', slug: 'crown-royal' },
  { num: 102, name: 'Rose of Sharon', slug: 'rose-of-sharon' },
  { num: 103, name: 'Bargello Strip', slug: 'bargello' },
  { num: 104, name: 'Dove at the Window', slug: 'dove-in-a-window' },
  { num: 105, name: 'Grandmothers Choice', slug: 'grandmothers-choice' },
];

const outputDir = '/home/chrishoran/Desktop/Quilt/quilt-block-images';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await context.newPage();

  const results = [];

  for (const block of blocks) {
    const url = `https://www.generations-quilt-patterns.com/${block.slug}-quilt-block.html`;
    const filename = `${String(block.num).padStart(3, '0')}-${block.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);

      // Try to find the block diagram image
      const blockImg = await page.$('img[src*="quilt-block"]');
      if (blockImg) {
        await blockImg.screenshot({ path: `${outputDir}/${filename}` });
        results.push({ num: block.num, name: block.name, status: 'OK', file: filename });
      } else {
        // Fallback: screenshot the main content area
        const content = await page.$('.content-area, article, main, .entry-content');
        if (content) {
          await content.screenshot({ path: `${outputDir}/${filename}` });
          results.push({ num: block.num, name: block.name, status: 'CONTENT', file: filename });
        } else {
          await page.screenshot({ path: `${outputDir}/${filename}`, fullPage: false });
          results.push({ num: block.num, name: block.name, status: 'FULLPAGE', file: filename });
        }
      }
    } catch (err) {
      results.push({
        num: block.num,
        name: block.name,
        status: `ERROR: ${err.message.substring(0, 80)}`,
        file: filename,
      });
    }

    console.log(`${block.num}/105: ${block.name} - ${results[results.length - 1].status}`);
  }

  console.log('\n=== SUMMARY ===');
  const ok = results.filter((r) => r.status === 'OK').length;
  const content = results.filter((r) => r.status === 'CONTENT').length;
  const fullpage = results.filter((r) => r.status === 'FULLPAGE').length;
  const errors = results.filter((r) => r.status.startsWith('ERROR')).length;
  console.log(`OK: ${ok}, Content: ${content}, FullPage: ${fullpage}, Errors: ${errors}`);
  console.log('\nErrors:');
  results
    .filter((r) => r.status.startsWith('ERROR'))
    .forEach((r) => console.log(`  ${r.num}. ${r.name}: ${r.status}`));

  await browser.close();
})();
