#!/bin/bash
OUTPUT_DIR="/home/chrishoran/Desktop/Quilt/quilt-block-images"
mkdir -p "$OUTPUT_DIR"

# Format: num|name|scissortail-slug
BLOCKS=(
"1|Nine Patch|9-patch-quilt-block"
"2|Churn Dash|churn-dash-quilt-block"
"3|Log Cabin|log-cabin-quilt-block"
"4|Ohio Star|ohio-star-quilt-block"
"5|Bear Paw|bears-paw-quilt-block"
"6|Pinwheel|pinwheel-quilt-block"
"7|Flying Geese|flying-geese-units"
"8|Drunkards Path|drunkards-path-quilt-block"
"9|Shoo Fly|shoofly-quilt-block"
"10|Sawtooth Star|sawtooth-quilt-block"
"11|Friendship Star|friendship-star-quilt-block"
"12|Square in a Square|square-in-a-square"
"13|Rail Fence|rail-fence-block-unit"
"14|Card Trick|card-trick-quilt-block"
"15|Double Star|double-star-quilt-block"
"16|Lone Star|lone-star-quilt-block"
"17|Tumbling Blocks|tumbling-blocks-quilt-block"
"18|Dresden Plate|dresden-plate-quilt-block"
"19|Irish Chain|double-irish-chain-quilt-block"
"20|HST|half-square-triangle"
"21|Four Patch|4-patch-unit"
"22|Double Four Patch|double-four-patch-quilt-block"
"23|Snowball|snowball-quilt-block"
"24|Bow Tie|bowtie-quilt-block"
"25|Windmill|windmill-quilt-block"
"26|Hourglass|hourglass-quilt-block"
"27|Broken Dishes|broken-dishes-quilt-block"
"28|Variable Star|variable-star-quilt-block"
"29|Evening Star|evening-star-quilt-block"
"30|North Star|north-star-quilt-block"
"31|Maple Leaf|maple-leaf-quilt-block"
"32|Basket|basket-quilt-block"
"33|Grandmothers Fan|grandmothers-fan-quilt-block"
"34|Economy Block|economy-quilt-block"
"35|Yankee Puzzle|yankee-puzzle-quilt-block"
"36|Dutchmans Puzzle|dutchmans-puzzle-quilt-block"
"37|Weather Vane|weathervane-quilt-block"
"38|Anvil|anvil-quilt-block"
"39|Puss in the Corner|puss-in-the-corner-quilt-block"
"40|Corn and Beans|corn-and-beans-quilt-block"
"41|Gentlemans Fancy|gentlemans-fancy-quilt-block"
"42|Jacobs Ladder|jacobs-ladder-quilt-block"
"43|Monkey Wrench|monkey-wrench-quilt-block"
"44|Courthouse Steps|courthouse-steps-quilt-block"
"45|Attic Windows|attic-window"
"46|Crosses and Losses|crosses-and-losses-quilt-block"
"47|Goose Tracks|goose-tracks-quilt-block"
"48|Handy Andy|handy-andy-quilt-block"
"49|Old Maids Puzzle|old-maids-puzzle-quilt-block"
"50|Road to Oklahoma|road-to-oklahoma-quilt-block"
"51|Double Nine Patch|double-nine-patch-quilt-block"
"52|Disappearing Nine Patch|disappearing-nine-patch-quilt-block"
"53|Split Nine Patch|split-nine-patch-quilt-block"
"54|Five Patch|five-patch-quilt-block"
"55|T-Block|t-block-quilt-block"
"56|Spider Web|spider-web-quilt-block"
"57|Kaleidoscope|kaleidoscope-quilt-block"
"58|Mosaic|mosaic-quilt-block"
"59|Roman Stripe|roman-stripe-quilt-block"
"60|Chinese Coins|chinese-coins-quilt-block"
"61|Snails Trail|snails-trail-quilt-block"
"62|Storm at Sea|storm-at-sea-quilt-block"
"63|Carpenters Star|carpenters-star-quilt-block"
"64|LeMoyne Star|lemoyne-star-quilt-block"
"65|Morning Star|morning-star-quilt-block"
"66|Hunters Star|hunters-star-quilt-block"
"67|Prairie Star|prairie-star-quilt-block"
"68|Rolling Star|rolling-star-quilt-block"
"69|Blazing Star|blazing-star-quilt-block"
"70|Mexican Star|mexican-star-quilt-block"
"71|Cathedral Star|cathedral-star-quilt-block"
"72|Broken Star|broken-star-quilt-block"
"73|Star of Bethlehem|star-of-bethlehem-quilt-block"
"74|Mariners Compass|mariners-compass-quilt-block"
"75|Ocean Waves|ocean-waves-quilt-block"
"76|Steps to the Altar|steps-to-the-altar-quilt-block"
"77|Spinning Top|spinning-top-quilt-block"
"78|Winged Square|winged-square-quilt-block"
"79|Cross and Crown|cross-and-crown-quilt-block"
"80|Devils Claw|devils-claw-quilt-block"
"81|Whirlwind|whirlwind-quilt-block"
"82|Double Pinwheel|double-pinwheel-quilt-block"
"83|Chevron|chevron-quilt-block"
"84|Schoolhouse|schoolhouse-quilt-block"
"85|Pine Tree|pine-tree-quilt-block"
"86|Tree of Life|tree-of-life-quilt-block"
"87|Sunflower|sunflower-quilt-block"
"88|Tulip Block|tulip-block-quilt-block"
"89|Carolina Lily|carolina-lily-quilt-block"
"90|Cactus Basket|cactus-basket-quilt-block"
"91|Butterfly|butterfly-quilt-block"
"92|Lily|lily-quilt-block"
"93|Pineapple|pineapple-quilt-block"
"94|Zigzag|london-steps-quilt-block"
"95|Herringbone|herringbone-quilt-block"
"96|Bricks|brickwork-quilt-block"
"97|Trip Around the World|trip-around-the-world-quilt-block"
"98|Cathedral Windows|cathedral-windows-quilt-block"
"99|Double Wedding Ring|double-wedding-ring-quilt-block"
"100|Grandmothers Flower Garden|grandmothers-flower-garden-quilt-block"
"101|Crown Royal|crown-royal-quilt-block"
"102|Rose of Sharon|rose-of-sharon-block"
"103|Bargello Strip|bargello-quilt-block"
"104|Dove at the Window|dove-in-a-window-quilt-block"
"105|Grandmothers Choice|grandmothers-choice-quilt-block"
)

TOTAL=${#BLOCKS[@]}
DOWNLOADED=0
FAILED=0

> "$OUTPUT_DIR/_failed.txt"

for entry in "${BLOCKS[@]}"; do
  IFS='|' read -r num name slug <<< "$entry"
  padded=$(printf "%03d" "$num")
  filename="${padded}-${name,,}.png"
  filename="${filename// /-}"
  filepath="$OUTPUT_DIR/$filename"
  
  if [ -f "$filepath" ] && [ -s "$filepath" ]; then
    echo "$num/$TOTAL: $name - SKIP (exists)"
    continue
  fi
  
  url="https://scissortailquilting.com/quilt-block-library/${slug}/"
  
  # Fetch page and extract image URLs
  page_content=$(curl -s -L --max-time 10 "$url" 2>/dev/null)
  
  # Find the main block image (wp-content/uploads)
  img_url=$(echo "$page_content" | grep -oP 'src="(https://scissortailquilting\.com/wp-content/uploads/[^"]*\.(jpg|jpeg|png|gif))"' | head -1 | sed 's/src="//;s/"//')
  
  if [ -z "$img_url" ]; then
    # Try alternate pattern
    img_url=$(echo "$page_content" | grep -oP 'src="(/wp-content/uploads/[^"]*\.(jpg|jpeg|png|gif))"' | head -1 | sed 's/src="//;s/"//')
    if [ -n "$img_url" ]; then
      img_url="https://scissortailquilting.com${img_url}"
    fi
  fi
  
  if [ -n "$img_url" ]; then
    curl -s -L --max-time 10 -o "$filepath" "$img_url" 2>/dev/null
    if [ -f "$filepath" ] && [ -s "$filepath" ]; then
      file_size=$(stat -c%s "$filepath" 2>/dev/null || echo "0")
      if [ "$file_size" -gt 2000 ]; then
        echo "$num/$TOTAL: $name - DOWNLOADED (${file_size}B)"
        ((DOWNLOADED++))
        continue
      fi
    fi
    rm -f "$filepath"
  fi
  
  # Failed - add to screenshot list
  echo "$num|$name|$slug|$url" >> "$OUTPUT_DIR/_failed.txt"
  echo "$num/$TOTAL: $name - FAILED (needs screenshot)"
  ((FAILED++))
done

echo ""
echo "=== DOWNLOAD SUMMARY ==="
echo "Total: $TOTAL | Downloaded: $DOWNLOADED | Failed: $FAILED"
if [ -f "$OUTPUT_DIR/_failed.txt" ]; then
  echo "Failed blocks saved to _failed.txt for screenshot fallback"
  cat "$OUTPUT_DIR/_failed.txt"
fi
