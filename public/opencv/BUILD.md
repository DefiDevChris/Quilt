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

If a custom build is not feasible, use `@techstark/opencv-js`:

```bash
npm install @techstark/opencv-js
```

The stock build is ~8+ MB and includes all OpenCV modules. This works for development but should be replaced with a custom build before launch.

## TODO

- [ ] Produce custom Emscripten build with only `core` + `imgproc`
- [ ] Verify WASM heap stays stable during leak smoke test
- [ ] Add `.gitignore` entry for `opencv.wasm` if > 1 MB (or commit if < 1 MB)
