# Scaffolding: Files, Dependencies, Config

## File Tree to Create

```
src/
  app/
    magic-wand/
      page.tsx                    # entry: UA gate + <MagicWandApp />
      layout.tsx                  # desktop-only wrapper
      MagicWandApp.tsx            # state-machine host
      stages/
        UploadStage.tsx
        CalibrateStage.tsx
        SegmentStage.tsx
        GroupStage.tsx
        CanonicalizeStage.tsx
        OutputStage.tsx
      components/
        RulerOverlay.tsx
        PatchCanvas.tsx           # Fabric.js canvas host
        GhostLayer.tsx             # overlay canvas, inherits viewport transform
        PickinessSlider.tsx
        ConfidenceBadge.tsx
        FabricGroupCard.tsx

  stores/
    magicWandStore.ts             # Zustand: stage, image, patches, groups, grid, undo

  lib/
    magic-wand/
      worker.ts                   # worker entry
      client.ts                   # main-thread promise-wrapped client
      messages.ts                 # typed message protocol
      engine/
        amg.ts                    # Automatic Mask Generator over SAM decoder
        features.ts               # LAB stats, palette, LBP, shape signature
        grouping.ts               # weighted distance, clustering
        canonicalize.ts           # shape library + fit + snap
        grid-inference.ts         # 2D autocorrelation, rotation search
        validators.ts             # Clipper.js-compatible polygon validator
        canonical-svg.ts          # CanonicalShape -> SVG path
      models/
        sam-loader.ts             # Cache API fetch for SAM ONNX
        opencv-init.ts            # OpenCV.js WASM init dance
      utils/
        image.ts                  # downscale, bitmap helpers
        lab.ts                    # sRGB <-> LAB
        polygon.ts                # CCW check, self-intersection, area
      __tests__/
        features.test.ts
        grouping.test.ts
        canonicalize.test.ts
        grid-inference.test.ts
        validators.test.ts

  types/
    magic-wand.ts                 # all types from 01-blueprint.md

public/
  models/
    mobile-sam/
      mobile_sam_encoder.onnx     # ~25 MB, NOT committed
      mobile_sam_decoder.onnx     # ~6 MB,  NOT committed
      LICENSE                     # Apache-2.0, required attribution

docs/magic-wand/
  (this plan; committed)
```

## Dependencies

```bash
npm install onnxruntime-web @techstark/opencv-js
npm install -D @types/offscreencanvas
```

Notes:
- `clipper-lib` is already present (`src/types/clipper-lib.d.ts`). Reuse for validation round-tripping.
- `@techstark/opencv-js` is a maintained OpenCV.js fork with TypeScript types.
- No server-side additions. All WASM, all client.

## next.config.ts Changes

```ts
async headers() {
  return [
    {
      source: '/magic-wand/:path*',
      headers: [
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
      ],
    },
    {
      source: '/models/mobile-sam/:path*',
      headers: [
        { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ];
},

webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      fs: false,
      path: false,
      crypto: false,
    };
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });
  }
  return config;
},
```

Rationale:
- `onnxruntime-web` multi-threaded runtime needs `SharedArrayBuffer`, which requires cross-origin isolation.
- WASM blobs must be served with correct MIME type and CORP header.

## Zustand Store Skeleton

```ts
// src/stores/magicWandStore.ts
import { create } from 'zustand';
import type {
  PatchFeature, FabricGroup, Grid, CanonicalShape,
} from '@/types/magic-wand';

type Stage = 'upload' | 'calibrate' | 'segment' | 'group' | 'canonicalize' | 'output';

type MagicWandState = {
  stage: Stage;
  imageBitmap: ImageBitmap | null;
  pxPerInch: number | null;

  patches: PatchFeature[];
  groups: FabricGroup[];
  grid: Grid | null;

  workerReady: boolean;
  modelDownloading: boolean;
  error: { code: string; message: string } | null;

  history: Snapshot[];
  future: Snapshot[];
};

type Snapshot = Pick<MagicWandState,
  'stage' | 'patches' | 'groups' | 'grid' | 'pxPerInch'
>;

type MagicWandActions = {
  setStage: (s: Stage) => void;
  setImage: (b: ImageBitmap) => void;
  setCalibration: (px: number) => void;
  setPatches: (p: PatchFeature[]) => void;
  createGroup: (seedPatchId: string) => string;
  addPatchesToGroup: (groupId: string, patchIds: string[]) => void;
  removePatchesFromGroup: (groupId: string, patchIds: string[]) => void;
  deleteGroup: (groupId: string) => void;
  setCanonical: (groupId: string, canonical: CanonicalShape) => void;
  setGrid: (g: Grid | null) => void;
  setError: (e: { code: string; message: string } | null) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
};

export const useMagicWandStore = create<MagicWandState & MagicWandActions>(
  (set, get) => ({
    // ... implementation per phase
  })
);
```

## Feature Gate

```tsx
// src/app/magic-wand/layout.tsx
const isDesktop =
  typeof navigator !== 'undefined' &&
  !/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) &&
  window.innerWidth >= 1024;

if (!isDesktop) {
  return <DesktopOnlyNotice feature="Magic Wand" />;
}
```

Also guard in root layout: if user lands on `/magic-wand` from mobile, render the notice, not the app. No redirect — keep the URL stable.

## Branding

Follow `brand_config.json`:
- Primary `#ff8d49`, Spline Sans headings, Inter body, 8 px radius for cards, `rounded-full` for CTAs.
- No hover movement. Hover changes color/background only, 150 ms ease-out.
- No spinners — opacity-pulse for loaders.
- Reuse existing tokens. Do not introduce new colors.

## Exit Criteria for Scaffolding

- [ ] Directory tree exists with placeholder files (empty default exports).
- [ ] Dependencies installed; `npm run build` passes.
- [ ] `next.config.ts` headers verified: `curl -I http://localhost:3000/magic-wand` returns COOP and COEP.
- [ ] `/magic-wand` route renders desktop-only notice on mobile viewport.
- [ ] `useMagicWandStore` exports and type-checks.
- [ ] `src/types/magic-wand.ts` holds all blueprint types.
- [ ] Model blobs NOT in git. `.gitignore` updated for `public/models/mobile-sam/*.onnx`.
