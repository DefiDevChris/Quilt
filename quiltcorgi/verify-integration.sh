#!/bin/bash

echo "🔍 Verifying Mobile Accessibility Integration..."
echo ""

# Check if all required files exist
echo "✓ Checking component files..."
files=(
  "src/hooks/useTapToPlaceBlock.ts"
  "src/hooks/useTapToPlaceFabric.ts"
  "src/components/canvas/UndoRedoOverlay.tsx"
  "src/components/canvas/TapToPlaceIndicator.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (MISSING)"
  fi
done

echo ""
echo "✓ Checking integration in StudioClient.tsx..."
if grep -q "useTapToPlaceBlock" src/components/studio/StudioClient.tsx; then
  echo "  ✅ useTapToPlaceBlock imported"
else
  echo "  ❌ useTapToPlaceBlock NOT imported"
fi

if grep -q "useTapToPlaceFabric" src/components/studio/StudioClient.tsx; then
  echo "  ✅ useTapToPlaceFabric imported"
else
  echo "  ❌ useTapToPlaceFabric NOT imported"
fi

if grep -q "UndoRedoOverlay" src/components/studio/StudioClient.tsx; then
  echo "  ✅ UndoRedoOverlay imported and rendered"
else
  echo "  ❌ UndoRedoOverlay NOT found"
fi

if grep -q "TapToPlaceIndicator" src/components/studio/StudioClient.tsx; then
  echo "  ✅ TapToPlaceIndicator imported and rendered"
else
  echo "  ❌ TapToPlaceIndicator NOT found"
fi

echo ""
echo "✓ Checking BlockLibrary.tsx integration..."
if grep -q "selectedBlockId" src/components/blocks/BlockLibrary.tsx; then
  echo "  ✅ selectedBlockId selector added"
else
  echo "  ❌ selectedBlockId selector NOT added"
fi

if grep -q "isSelected={selectedBlockId === block.id}" src/components/blocks/BlockLibrary.tsx; then
  echo "  ✅ BlockCard isSelected prop wired"
else
  echo "  ❌ BlockCard isSelected prop NOT wired"
fi

echo ""
echo "✓ Checking store methods..."
if grep -q "setSelectedBlockId" src/stores/blockStore.ts; then
  echo "  ✅ blockStore.setSelectedBlockId exists"
else
  echo "  ❌ blockStore.setSelectedBlockId MISSING"
fi

if grep -q "setSelectedFabric" src/stores/fabricStore.ts; then
  echo "  ✅ fabricStore.setSelectedFabric exists"
else
  echo "  ❌ fabricStore.setSelectedFabric MISSING"
fi

echo ""
echo "🎉 Integration verification complete!"
echo ""
echo "Next steps:"
echo "  1. npm run dev"
echo "  2. Open studio and test features"
echo "  3. See INTEGRATION_COMPLETE.md for testing checklist"
