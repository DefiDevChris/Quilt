# OpenCV.js Build Instructions

## Custom Build (Preferred — 3-4 MB)

A custom build with only `core` and `imgproc` modules keeps the WASM bundle at ~3-4 MB.

### Prerequisites

- Emscripten SDK installed and activated (`emsdk install latest && emsdk activate latest`)
- Python 3.x
- CMake 3.x

### Build Command

```bash
python ./platforms/js/build_js.py build_js \
  --build_wasm \
  --disable_wasm_simd_optimized_build \
  --cmake_option="-DBUILD_LIST=core,imgproc"
```

### Verify Symbols

After building, verify these symbols resolve in the browser console:

```
cv.bilateralFilter, cv.kmeans, cv.connectedComponents, cv.findContours,
cv.approxPolyDP, cv.Canny, cv.CLAHE, cv.getPerspectiveTransform,
cv.warpPerspective, cv.cvtColor, cv.GaussianBlur, cv.split, cv.merge,
cv.morphologyEx, cv.HoughLinesP, cv.resize
```

### Output

Copy `build_js/bin/opencv.js` and `build_js/bin/opencv.wasm` to `public/opencv/`.

## Stock Build (Fallback)

If a custom build is not feasible, use the stock OpenCV.js distribution:

```bash
curl -sL -o public/opencv/opencv.js "https://docs.opencv.org/4.10.0/opencv.js"
```

This ships the full ~10 MB WASM bundle. Works for development but should be
replaced with a custom `core,imgproc` build before launch. The file is
gitignored so the bundle never lands in the repo.

### Known quirks of the stock 4.10 build

The stock distribution omits a few enums/methods the Photo-to-Design pipeline
originally relied on; `pipeline.ts` works around each:

- `cv.COLOR_RGBA2Lab` and `cv.COLOR_Lab2RGBA` are missing → go via
  `COLOR_RGBA2RGB` → `COLOR_RGB2Lab` (and the reverse).
- `cv.bilateralFilter` rejects 4-channel RGBA Mats → strip alpha first.
- `Mat.reshape` is not exposed → build sample matrices directly from
  `mat.data` Float32/Int32 arrays.
- `cv.TermCriteria` is a plain JS struct, not a wrapped C++ object →
  never call `.delete()` on it.

## TODO

- [ ] Produce custom Emscripten build with only `core` + `imgproc`
- [ ] Verify WASM heap stays stable during leak smoke test
- [ ] Add `.gitignore` entry for `opencv.wasm` if > 1 MB (or commit if < 1 MB)
