#!/bin/bash
# Generate 25 diverse quilt project images

export DASHSCOPE_API_KEY="sk-e606600ec381403c9e0488b32e396e08"
export DASHSCOPE_BASE_URL="https://dashscope-intl.aliyuncs.com/api/v1"
export IMAGE_GEN_MODEL="qwen-image-2.0"

OUTPUT_DIR="/home/chrishoran/Desktop/Quilt/quiltcorgi/public/images/quilts"
mkdir -p "$OUTPUT_DIR"

echo "Generating 25 diverse quilt images..."

# 1-5: Quilts on beds
python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A beautiful completed patchwork quilt with geometric diamond patterns in coral, teal, and cream colors, neatly spread on a queen-sized bed with white linens and decorative pillows, soft morning sunlight streaming through sheer curtains, cozy bedroom interior, photorealistic, professional interior photography, high detail" \
  --output "$OUTPUT_DIR/quilt_01_bed_geometric.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A handmade grandmother's flower garden quilt with colorful hexagonal pieces in pastel pinks, lavenders, mint greens, and butter yellows, draped elegantly over a king-sized bed with white sheets, farmhouse style bedroom, warm golden hour lighting, high detail photography" \
  --output "$OUTPUT_DIR/quilt_02_bed_hexagon.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A modern minimalist quilt with large color blocks in navy blue, mustard yellow, and gray, spread on a platform bed with white bedding, Scandinavian bedroom design, clean lines, natural daylight, contemporary interior photography" \
  --output "$OUTPUT_DIR/quilt_03_bed_modern.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A traditional Irish chain quilt in red, white, and blue patriotic colors, neatly folded at the foot of a double bed, guest room with soft blue walls, vintage furniture, soft diffused lighting, photorealistic detail" \
  --output "$OUTPUT_DIR/quilt_04_bed_chain.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A cozy flannel patchwork quilt in autumn colors of burnt orange, forest green, and brown plaid patterns, rumpled on an unmade bed with pillows, cabin-style bedroom, wooden walls, warm ambient lighting, hygge aesthetic" \
  --output "$OUTPUT_DIR/quilt_05_bed_flannel.png" --size 1K

# 6-10: Quilts hanging/displayed
python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A stunning art quilt with abstract landscape design featuring mountains and sunset in purple, orange, and gold fabrics, hanging on a white gallery wall with track lighting above, museum display setting, professional art photography" \
  --output "$OUTPUT_DIR/quilt_06_wall_art.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A vintage wedding ring quilt in soft cream, pale pink, and sage green, hanging on a rustic wooden ladder against a shiplap wall, farmhouse living room, natural window light, cozy cottage aesthetic" \
  --output "$OUTPUT_DIR/quilt_07_ladder_ring.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A bright log cabin quilt with red center squares surrounded by multicolored strips, displayed on a quilt rack in a hallway, Victorian home interior, soft warm lighting, traditional American craft photography" \
  --output "$OUTPUT_DIR/quilt_08_rack_cabin.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A modern flying geese quilt pattern in gradient blues from navy to sky blue, hanging on a concrete wall in a loft apartment, industrial interior design, dramatic side lighting, contemporary textile art display" \
  --output "$OUTPUT_DIR/quilt_09_wall_geese.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A commemorative memory quilt made from baby clothes with various pastel fabric squares and embroidered details, hanging in a nursery with soft pink walls, gentle lighting, sentimental keepsake photography" \
  --output "$OUTPUT_DIR/quilt_10_nursery_memory.png" --size 1K

# 11-15: Quilts on furniture/lifestyle
python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A colorful crazy quilt with Victorian velvet patches, embroidered details, and lace trim, elegantly draped over an antique Victorian armchair with carved wooden details, parlor room setting, rich warm lighting, vintage aesthetic" \
  --output "$OUTPUT_DIR/quilt_11_chair_crazy.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A handmade star pattern quilt in navy blue, burgundy wine, and cream white, casually thrown over a leather reading chair with a side table holding a teacup and book, cozy reading nook, warm afternoon light" \
  --output "$OUTPUT_DIR/quilt_12_chair_star.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A jelly roll race quilt with colorful strips creating a dynamic diagonal pattern in rainbow colors, folded neatly on a window seat with cushions, sunroom with plants, bright natural light, cheerful home interior" \
  --output "$OUTPUT_DIR/quilt_13_window_rainbow.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A soft chenille quilt with textured white on white patterns, draped over a white wicker loveseat on a screened porch, beach house setting, soft coastal lighting, breezy relaxed atmosphere" \
  --output "$OUTPUT_DIR/quilt_14_porch_chenille.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A holiday-themed Christmas quilt with red and green patchwork, holly patterns, and snowflake designs, displayed on a rocking chair by a fireplace with stockings, cozy Christmas setting, warm firelight glow" \
  --output "$OUTPUT_DIR/quilt_15_fireplace_holiday.png" --size 1K

# 16-20: Work in progress / crafting
python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A half-finished quilt top with triangle pieces laid out on a design wall, showing the layout process, quilter's studio with fabric stacks visible, bright task lighting, overhead angle, creative workspace photography" \
  --output "$OUTPUT_DIR/quilt_16_wip_designwall.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Quilt blocks in progress on a cutting mat with rotary cutter, acrylic ruler, and fabric pieces scattered around, sewing room table, natural light from window, crafting flat lay photography" \
  --output "$OUTPUT_DIR/quilt_17_table_cutting.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Hand quilting in progress with needle and thread visible, hoop holding layered quilt sandwich, close-up detail of small even stitches, hands visible stitching, soft focused background, macro textile photography" \
  --output "$OUTPUT_DIR/quilt_18_detail_handquilting.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A sewing machine quilting a large quilt with walking foot, free-motion quilting pattern visible, sewing room with fabric bolts in background, action shot, shallow depth of field, craft photography" \
  --output "$OUTPUT_DIR/quilt_19_machine_quilting.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Binding being hand-sewn onto quilt edge with clips holding it in place, needle and thread, close-up of finishing work, wooden table surface, natural light, detailed craft photography" \
  --output "$OUTPUT_DIR/quilt_20_binding_finish.png" --size 1K

# 21-25: Detail shots and textures
python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Extreme close-up of intricate quilting stitches forming a feather pattern on white fabric, showing texture and detail of professional long-arm quilting, macro photography, soft lighting on texture" \
  --output "$OUTPUT_DIR/quilt_21_detail_feather.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Close-up detail of a scrappy quilt showing various fabric patterns - florals, polka dots, stripes, and solids pieced together, texture of cotton fabrics, warm lighting emphasizing the patchwork" \
  --output "$OUTPUT_DIR/quilt_22_detail_scrappy.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Batting and backing fabric layers visible with quilt top pinned and ready for quilting, safety pins marking layers, work in progress texture shot, studio lighting, craft documentation photography" \
  --output "$OUTPUT_DIR/quilt_23_layers_basting.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "Vintage antique quilt from 1930s with feedsack fabric prints, worn and loved appearance, slight fading, hand-stitched details visible, historical textile photography, neutral background, museum catalog style" \
  --output "$OUTPUT_DIR/quilt_24_vintage_feedsack.png" --size 1K

python3 ~/.claude/tools/image-gen.py generate \
  --prompt "A completed quilt with modern improv piecing in bold colors of fuchsia, orange, and teal, artistically arranged on a wooden floor with flowers and coffee cup, styled lifestyle photography, bright cheerful lighting" \
  --output "$OUTPUT_DIR/quilt_25_floor_improv.png" --size 1K

echo ""
echo "All 25 quilt images generated!"
echo "Location: $OUTPUT_DIR"
ls -la "$OUTPUT_DIR"
