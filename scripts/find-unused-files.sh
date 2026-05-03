#!/bin/bash
# Find all .ts/.tsx files in src/lib and check if they are imported anywhere in src/
find src/lib -name "*.ts" -o -name "*.tsx" | while read -r file; do
  # Get the import path pattern, e.g., @/lib/resize-utils or @/lib/pdf-engine/index
  # Also check for relative imports within src/lib
  rel_path="${file#src/}"
  base=$(basename "$file" .ts)
  base_tsx=$(basename "$file" .tsx)
  
  # Search for imports of this file
  # Pattern 1: @/lib/.../filename
  pattern1="@/${rel_path%.ts}"
  pattern1_tsx="@/${rel_path%.tsx}"
  
  count=$(grep -rn "from ['\"].*${pattern1}['\"]" src/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v "$file" | wc -l)
  count2=$(grep -rn "from ['\"].*${pattern1_tsx}['\"]" src/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v "$file" | wc -l)
  
  if [ "$count" -eq 0 ] && [ "$count2" -eq 0 ]; then
    # Also check for relative imports from other lib files
    rel_count=$(grep -rn "from ['\"]\.*${rel_path%.ts}['\"]" src/lib/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v "$file" | wc -l)
    rel_count2=$(grep -rn "from ['\"]\.*${rel_path%.tsx}['\"]" src/lib/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v "$file" | wc -l)
    
    if [ "$rel_count" -eq 0 ] && [ "$rel_count2" -eq 0 ]; then
      echo "DEAD: $file"
    fi
  fi
done
