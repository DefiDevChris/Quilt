#!/bin/bash
# Generate realistic quilt photos - close-ups and sewing studio shots

export DASHSCOPE_API_KEY="sk-e606600ec381403c9e0488b32e396e08"
export DASHSCOPE_BASE_URL="https://dashscope-intl.aliyuncs.com/api/v1"
export IMAGE_GEN_MODEL="qwen-image-2.0"

OUTPUT_DIR="/home/chrishoran/Desktop/Quilt/quiltcorgi/public/images/quilts"
mkdir -p "$OUTPUT_DIR"

echo "Generating realistic quilt photos - close-ups and studio shots..."

# CLOSE-UPS - quilt fills frame, minimal background
python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Close-up photo of a handmade patchwork quilt with blue and white churn dash blocks, slightly wrinkled fabric texture visible, photographed from above at slight angle, shallow depth of field, edges of quilt visible at frame borders, natural daylight, iPhone photography style, casual snap" \
  --output "$OUTPUT_DIR/quilt_01_closeup_churndash.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Macro detail shot of quilting stitches on a gray and yellow flying geese quilt, individual stitches clearly visible, fabric slightly puckered around stitching, quilt edges visible at left and right of frame, soft natural window light, amateur photography, realistic texture" \
  --output "$OUTPUT_DIR/quilt_02_closeup_stitches.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Top-down flat lay of a colorful scrappy quilt corner showing various fabric patterns - florals, dots, stripes pieced together, quilt takes up 90% of frame, slightly uneven edges, photographed on carpet, natural lighting, casual smartphone photo" \
  --output "$OUTPUT_DIR/quilt_03_closeup_scrappy.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Close-up of a red and white bear paw quilt block pattern, slightly faded fabric, visible stitching lines, quilt extends beyond frame edges, photographed in natural daylight with soft shadows, authentic handmade appearance, realistic fabric texture" \
  --output "$OUTPUT_DIR/quilt_04_closeup_bearpaw.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Detail shot of binding on a green and cream quilt, double-fold binding visible at quilt edge, mitered corner, slightly imperfect hand stitching, quilt fills frame with just edge visible, natural lighting, macro photography style" \
  --output "$OUTPUT_DIR/quilt_05_closeup_binding.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Close-up of a baby quilt with pastel triangle pieces in pink, mint, and lavender, soft minky fabric backing slightly visible at edge, quilt takes up most of frame, slightly wrinkled from use, natural window light, warm tones" \
  --output "$OUTPUT_DIR/quilt_06_closeup_baby.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Overhead shot of a navy and orange modern quilt with improv piecing, slightly askew angle, quilt corners visible at frame edges, texture of cotton fabric evident, photographed on wood floor just barely visible at edges, natural daylight" \
  --output "$OUTPUT_DIR/quilt_07_closeup_modern.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Close-up of log cabin quilt blocks with red centers and various blue strips, slightly mismatched seams visible, quilt extends beyond frame on all sides, natural daylight with slight shadows, authentic homemade appearance" \
  --output "$OUTPUT_DIR/quilt_08_closeup_logcabin.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Macro shot of a vintage grandmother's flower garden quilt showing hexagon pieces in faded 1930s reproduction fabrics, hand-stitched visible, aged fabric texture, quilt fills frame with edges just visible, soft natural light" \
  --output "$OUTPUT_DIR/quilt_09_closeup_vintage.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Detail of star pattern quilt in gray, white, and yellow, one complete star visible in center with parts of adjacent stars at edges, slightly wrinkled from washing, photographed flat from above, natural lighting, smartphone photo quality" \
  --output "$OUTPUT_DIR/quilt_10_closeup_star.png" --size 1K

# SEWING STUDIO / TABLE SHOTS
python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Quilt top spread on a cutting mat on a craft table, surrounded by fabric scraps, rotary cutter, and ruler at edges of frame, quilt takes up center 70% of image, cluttered realistic sewing room background, fluorescent lighting mixed with window light, candid photo" \
  --output "$OUTPUT_DIR/quilt_11_table_layout.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Work in progress quilt blocks arranged on a flannel design wall in home sewing room, partially assembled quilt top visible, ironing board just visible at edge, cluttered shelves in background, natural window light, realistic home studio photo" \
  --output "$OUTPUT_DIR/quilt_12_studio_designwall.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Hand quilting in progress with quilt in hoop on lap, hands visible at bottom of frame holding needle, quilt pattern visible in hoop taking up 60% of frame, living room couch and coffee table slightly visible in background, cozy evening lighting" \
  --output "$OUTPUT_DIR/quilt_13_hoop_lap.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Quilt laid out on dining room table for basting, layers visible with safety pins scattered across surface, chairs around table partially visible at edges, overhead angle, natural daylight from sliding doors, realistic home setting" \
  --output "$OUTPUT_DIR/quilt_14_table_basting.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Fabric pieces and half-square triangles scattered on cutting table with quilt blocks in progress, sewing machine visible in background out of focus, ruler and rotary cutter on table, overhead shot, bright task lighting, craft room environment" \
  --output "$OUTPUT_DIR/quilt_15_table_piecing.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Longarm quilting machine quilting a large quilt in professional studio, quilt rolled on frame taking up most of image, just edge of machine visible, industrial studio setting with concrete floors, bright overhead lighting, documentary style photo" \
  --output "$OUTPUT_DIR/quilt_16_longarm_studio.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Quilt sandwich layers spread on carpet floor for pin basting, pins visible stuck through layers, living room setting with couch legs visible at edges, natural afternoon light from window, candid work-in-progress photo" \
  --output "$OUTPUT_DIR/quilt_17_floor_basting.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Small quilted wall hanging on a sewing room wall, surrounded by fabric swatches and quilting tools on pegboard, quilt takes up center of frame, cluttered creative workspace visible at edges, warm incandescent lighting" \
  --output "$OUTPUT_DIR/quilt_18_wall_studio.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Stack of folded quilt tops on a shelf in sewing room, various patterns visible - stripes, florals, geometric, fabric bolts visible in background, slightly cluttered realistic storage, natural light, snapshot style photography" \
  --output "$OUTPUT_DIR/quilt_19_shelf_stacked.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Quilt binding being hand-sewn, sitting in a comfortable armchair with quilt in lap, window light from side, just quilt and hands visible in frame with chair arm at bottom edge, cozy evening sewing session, warm lighting" \
  --output "$OUTPUT_DIR/quilt_20_chair_binding.png" --size 1K

# NATURAL LIFESTYLE SHOTS - quilts in use
python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Quilt rumpled on a bed from recent use, unmade bed with quilt partially falling off, natural morning light through window, just corner of room visible, lived-in authentic bedroom, snapshot style" \
  --output "$OUTPUT_DIR/quilt_21_bed_unmade.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Quilt draped over porch railing, outdoor setting with garden slightly visible in background, quilt catching breeze with soft folds, natural daylight, relaxed country home aesthetic, candid outdoor photo" \
  --output "$OUTPUT_DIR/quilt_22_porch_railing.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Baby quilt on nursery floor with toys scattered at edges of frame, quilt slightly bunched up from play, soft pastel colors, natural window light, lived-in nursery setting, authentic lifestyle photo" \
  --output "$OUTPUT_DIR/quilt_23_nursery_floor.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Quilt thrown over sofa arm, living room setting with coffee table and lamp just visible at frame edges, cozy lived-in appearance, warm evening lighting, authentic home photo, slight blur from casual snapshot" \
  --output "$OUTPUT_DIR/quilt_24_sofa_casual.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Picnic quilt spread on grass in backyard, slightly rumpled from sitting, grass visible at edges of frame, outdoor natural lighting, casual summer day, authentic amateur photography, bright daylight" \
  --output "$OUTPUT_DIR/quilt_25_grass_picnic.png" --size 1K

echo ""
echo "All 25 realistic quilt photos generated!"
echo "Location: $OUTPUT_DIR"
ls -la "$OUTPUT_DIR"
