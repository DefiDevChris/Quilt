#!/bin/bash

# Quilt Block Image Downloader
# Tries to download images first, falls back to screenshots via Playwright

OUTPUT_DIR="/home/chrishoran/Desktop/Quilt/quilt-block-images"
mkdir -p "$OUTPUT_DIR"

# Map: number|name|scissortail-slug|search-query
# Scissortail slugs from the library page we browsed
BLOCKS=(
  "1|Nine Patch|9-patch-quilt-block|Nine Patch quilt block diagram"
  "2|Churn Dash|churn-dash-quilt-block|Churn Dash quilt block diagram"
  "3|Log Cabin|log-cabin-quilt-block|Log Cabin quilt block diagram"
  "4|Ohio Star|ohio-star-quilt-block|Ohio Star quilt block diagram"
  "5|Bear Paw|bears-paw-quilt-block|Bear Paw quilt block diagram"
  "6|Pinwheel|pinwheel-quilt-block|Pinwheel quilt block diagram"
  "7|Flying Geese|flying-geese-units|Flying Geese quilt block diagram"
  "8|Drunkards Path|drunkards-path-quilt-block|Drunkards Path quilt block diagram"
  "9|Shoo Fly|shoofly-quilt-block|Shoo Fly quilt block diagram"
  "10|Sawtooth Star|sawtooth-quilt-block|Sawtooth Star quilt block diagram"
  "11|Friendship Star|friendship-star-quilt-block|Friendship Star quilt block diagram"
  "12|Square in a Square|square-in-a-square|Square in a Square quilt block diagram"
  "13|Rail Fence|rail-fence-block-unit|Rail Fence quilt block diagram"
  "14|Card Trick|card-trick-quilt-block|Card Trick quilt block diagram"
  "15|Double Star|double-star-quilt-block|Double Star quilt block diagram"
  "16|Lone Star|lone-star-quilt-block|Lone Star quilt block diagram"
  "17|Tumbling Blocks|tumbling-blocks-quilt-block|Tumbling Blocks quilt block diagram"
  "18|Dresden Plate|dresden-plate-quilt-block|Dresden Plate quilt block diagram"
  "19|Irish Chain|double-irish-chain-quilt-block|Irish Chain quilt block diagram"
  "20|HST|half-square-triangle|Half Square Triangle quilt block diagram"
  "21|Four Patch|4-patch-unit|Four Patch quilt block diagram"
  "22|Double Four Patch|double-four-patch-quilt-block|Double Four Patch quilt block diagram"
  "23|Snowball|snowball-quilt-block|Snowball quilt block diagram"
  "24|Bow Tie|bowtie-quilt-block|Bow Tie quilt block diagram"
  "25|Windmill|windmill-quilt-block|Windmill quilt block diagram"
  "26|Hourglass|hourglass-quilt-block|Hourglass quilt block diagram"
  "27|Broken Dishes|broken-dishes-quilt-block|Broken Dishes quilt block diagram"
  "28|Variable Star|variable-star-quilt-block|Variable Star quilt block diagram"
  "29|Evening Star|evening-star-quilt-block|Evening Star quilt block diagram"
  "30|North Star|north-star-quilt-block|North Star quilt block diagram"
  "31|Maple Leaf|maple-leaf-quilt-block|Maple Leaf quilt block diagram"
  "32|Basket|basket-quilt-block|Basket quilt block diagram"
  "33|Grandmothers Fan|grandmothers-fan-quilt-block|Grandmothers Fan quilt block diagram"
  "34|Economy Block|economy-quilt-block|Economy quilt block diagram"
  "35|Yankee Puzzle|yankee-puzzle-quilt-block|Yankee Puzzle quilt block diagram"
  "36|Dutchmans Puzzle|dutchmans-puzzle-quilt-block|Dutchmans Puzzle quilt block diagram"
  "37|Weather Vane|weathervane-quilt-block|Weather Vane quilt block diagram"
  "38|Anvil|anvil-quilt-block|Anvil quilt block diagram"
  "39|Puss in the Corner|puss-in-the-corner-quilt-block|Puss in the Corner quilt block diagram"
  "40|Corn and Beans|corn-and-beans-quilt-block|Corn and Beans quilt block diagram"
  "41|Gentlemans Fancy|gentlemans-fancy-quilt-block|Gentlemans Fancy quilt block diagram"
  "42|Jacobs Ladder|jacobs-ladder-quilt-block|Jacobs Ladder quilt block diagram"
  "43|Monkey Wrench|monkey-wrench-quilt-block|Monkey Wrench quilt block diagram"
  "44|Courthouse Steps|courthouse-steps-quilt-block|Courthouse Steps quilt block diagram"
  "45|Attic Windows|attic-window|Attic Windows quilt block diagram"
  "46|Crosses and Losses|crosses-and-losses-quilt-block|Crosses and Losses quilt block diagram"
  "47|Goose Tracks|goose-tracks-quilt-block|Goose Tracks quilt block diagram"
  "48|Handy Andy|handy-andy-quilt-block|Handy Andy quilt block diagram"
  "49|Old Maids Puzzle|old-maids-puzzle-quilt-block|Old Maids Puzzle quilt block diagram"
  "50|Road to Oklahoma|road-to-oklahoma-quilt-block|Road to Oklahoma quilt block diagram"
  "51|Double Nine Patch|double-nine-patch-quilt-block|Double Nine Patch quilt block diagram"
  "52|Disappearing Nine Patch|disappearing-nine-patch-quilt-block|Disappearing Nine Patch quilt block diagram"
  "53|Split Nine Patch|split-nine-patch-quilt-block|Split Nine Patch quilt block diagram"
  "54|Five Patch|five-patch-quilt-block|Five Patch quilt block diagram"
  "55|T-Block|t-block-quilt-block|T Block quilt block diagram"
  "56|Spider Web|spider-web-quilt-block|Spider Web quilt block diagram"
  "57|Kaleidoscope|kaleidoscope-quilt-block|Kaleidoscope quilt block diagram"
  "58|Mosaic|mosaic-quilt-block|Mosaic quilt block diagram"
  "59|Roman Stripe|roman-stripe-quilt-block|Roman Stripe quilt block diagram"
  "60|Chinese Coins|chinese-coins-quilt-block|Chinese Coins quilt block diagram"
  "61|Snails Trail|snails-trail-quilt-block|Snails Trail quilt block diagram"
  "62|Storm at Sea|storm-at-sea-quilt-block|Storm at Sea quilt block diagram"
  "63|Carpenters Star|carpenters-star-quilt-block|Carpenters Star quilt block diagram"
  "64|LeMoyne Star|lemoyne-star-quilt-block|LeMoyne Star quilt block diagram"
  "65|Morning Star|morning-star-quilt-block|Morning Star quilt block diagram"
  "66|Hunters Star|hunters-star-quilt-block|Hunters Star quilt block diagram"
  "67|Prairie Star|prairie-star-quilt-block|Prairie Star quilt block diagram"
  "68|Rolling Star|rolling-star-quilt-block|Rolling Star quilt block diagram"
  "69|Blazing Star|blazing-star-quilt-block|Blazing Star quilt block diagram"
  "70|Mexican Star|mexican-star-quilt-block|Mexican Star quilt block diagram"
  "71|Cathedral Star|cathedral-star-quilt-block|Cathedral Star quilt block diagram"
  "72|Broken Star|broken-star-quilt-block|Broken Star quilt block diagram"
  "73|Star of Bethlehem|star-of-bethlehem-quilt-block|Star of Bethlehem quilt block diagram"
  "74|Mariners Compass|mariners-compass-quilt-block|Mariners Compass quilt block diagram"
  "75|Ocean Waves|ocean-waves-quilt-block|Ocean Waves quilt block diagram"
  "76|Steps to the Altar|steps-to-the-altar-quilt-block|Steps to the Altar quilt block diagram"
  "77|Spinning Top|spinning-top-quilt-block|Spinning Top quilt block diagram"
  "78|Winged Square|winged-square-quilt-block|Winged Square quilt block diagram"
  "79|Cross and Crown|cross-and-crown-quilt-block|Cross and Crown quilt block diagram"
  "80|Devils Claw|devils-claw-quilt-block|Devils Claw quilt block diagram"
  "81|Whirlwind|whirlwind-quilt-block|Whirlwind quilt block diagram"
  "82|Double Pinwheel|double-pinwheel-quilt-block|Double Pinwheel quilt block diagram"
  "83|Chevron|chevron-quilt-block|Chevron quilt block diagram"
  "84|Schoolhouse|schoolhouse-quilt-block|Schoolhouse quilt block diagram"
  "85|Pine Tree|pine-tree-quilt-block|Pine Tree quilt block diagram"
  "86|Tree of Life|tree-of-life-quilt-block|Tree of Life quilt block diagram"
  "87|Sunflower|sunflower-quilt-block|Sunflower quilt block diagram"
  "88|Tulip Block|tulip-block-quilt-block|Tulip Block quilt block diagram"
  "89|Carolina Lily|carolina-lily-quilt-block|Carolina Lily quilt block diagram"
  "90|Cactus Basket|cactus-basket-quilt-block|Cactus Basket quilt block diagram"
  "91|Butterfly|butterfly-quilt-block|Butterfly quilt block diagram"
  "92|Lily|lily-quilt-block|Lily quilt block diagram"
  "93|Pineapple|pineapple-quilt-block|Pineapple quilt block diagram"
  "94|Zigzag|zigzag-quilt-block|Zigzag quilt block diagram"
  "95|Herringbone|herringbone-quilt-block|Herringbone quilt block diagram"
  "96|Bricks|brickwork-quilt-block|Bricks quilt block diagram"
  "97|Trip Around the World|trip-around-the-world-quilt-block|Trip Around the World quilt block diagram"
  "98|Cathedral Windows|cathedral-windows-quilt-block|Cathedral Windows quilt block diagram"
  "99|Double Wedding Ring|double-wedding-ring-quilt-block|Double Wedding Ring quilt block diagram"
  "100|Grandmothers Flower Garden|grandmothers-flower-garden-quilt-block|Grandmothers Flower Garden quilt block diagram"
  "101|Crown Royal|crown-royal-quilt-block|Crown Royal quilt block diagram"
  "102|Rose of Sharon|rose-of-sharon-block|Rose of Sharon quilt block diagram"
  "103|Bargello Strip|bargello-quilt-block|Bargello Strip quilt block diagram"
  "104|Dove at the Window|dove-in-a-window-quilt-block|Dove at the Window quilt block diagram"
  "105|Grandmothers Choice|grandmothers-choice-quilt-block|Grandmothers Choice quilt block diagram"
)

TOTAL=${#BLOCKS[@]}
SUCCESS=0
DOWNLOAD=0
SCREENSHOT=0
FAILED=0

for entry in "${BLOCKS[@]}"; do
  IFS='|' read -r num name slug search_query <<< "$entry"
  padded=$(printf "%03d" "$num")
  filename="${padded}-${name,,}.png"
  filename="${filename// /-}"
  filepath="$OUTPUT_DIR/$filename"
  
  if [ -f "$filepath" ]; then
    echo "$num/$TOTAL: $name - SKIP (exists)"
    ((SUCCESS++))
    continue
  fi
  
  # Try 1: Download image from Scissortail Quilting
  echo "$num/$TOTAL: $name - Trying download..."
  url="https://scissortailquilting.com/quilt-block-library/${slug}/"
  
  # Fetch page and extract image URL
  page_content=$(curl -s -L "$url" 2>/dev/null)
  
  # Try to find the main block image (look for wp-content/uploads or similar)
  img_url=$(echo "$page_content" | grep -oP 'src="[^"]*wp-content/uploads/[^"]*\.(jpg|jpeg|png|gif)"' | head -1 | sed 's/src="//;s/"//')
  
  if [ -n "$img_url" ] && echo "$img_url" | grep -q "wp-content"; then
    # Download the image
    curl -s -L -o "$filepath" "$img_url" 2>/dev/null
    if [ -f "$filepath" ] && [ -s "$filepath" ]; then
      file_size=$(stat -c%s "$filepath" 2>/dev/null || echo "0")
      if [ "$file_size" -gt 1000 ]; then
        echo "$num/$TOTAL: $name - DOWNLOADED (${file_size} bytes)"
        ((DOWNLOAD++))
        ((SUCCESS++))
        continue
      fi
    fi
    rm -f "$filepath"
  fi
  
  # Try 2: Find any quilt block image on the page
  img_url=$(echo "$page_content" | grep -oP 'src="https://scissortailquilting\.com/wp-content/[^"]*\.(jpg|jpeg|png)"' | head -1 | sed 's/src="//;s/"//')
  
  if [ -n "$img_url" ]; then
    curl -s -L -o "$filepath" "$img_url" 2>/dev/null
    if [ -f "$filepath" ] && [ -s "$filepath" ]; then
      file_size=$(stat -c%s "$filepath" 2>/dev/null || echo "0")
      if [ "$file_size" -gt 1000 ]; then
        echo "$num/$TOTAL: $name - DOWNLOADED alt (${file_size} bytes)"
        ((DOWNLOAD++))
        ((SUCCESS++))
        continue
      fi
    fi
    rm -f "$filepath"
  fi
  
  # Mark for screenshot
  echo "$num/$TOTAL: $name - NEEDS SCREENSHOT"
  echo "${num}|${name}|${slug}|${search_query}" >> "$OUTPUT_DIR/_needs_screenshot.txt"
  ((FAILED++))
done

echo ""
echo "=== DOWNLOAD SUMMARY ==="
echo "Total: $TOTAL"
echo "Already existed: $SUCCESS"
echo "Downloaded: $DOWNLOAD"
echo "Need screenshot: $FAILED"
