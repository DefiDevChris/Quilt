PROMPT 2 — Image Upload, Perspective Correction & Calibration
Context

You are building the first 3 screens of the Photo-to-Design feature in a Next.js 15 / React 19 app. The foundation from Prompt 1 exists: a Zustand store (usePhotoDesignStore), a Web Worker that loads OpenCV.js, a MatRegistry for memory management, and a typed message protocol.

These 3 screens collect the user's photo and set up the geometry before any processing happens.
Shared Types You Have

typescript

interface Point { x: number; y: number }

The store has: stage, sourceFile, sourceObjectUrl, sourceDimensions, corners, correctedImageUrl, calibrationPoints, calibrationDistance, calibrationUnit, pixelsPerUnit.
What to Build
Screen 1: Upload

A drop zone that accepts a photo.

    Accept: JPEG, PNG, WebP, HEIC
    Show a large drop area with an icon and text: "Drop a photo of your quilt here, or tap to browse"
    On mobile, also offer a "Take Photo" button that opens the camera
    When a file is selected:
        Read EXIF orientation tag and apply rotation so the image displays correctly. Use a small EXIF library or manual EXIF parsing of the orientation tag.
        If the image is HEIC and the browser can't decode it natively, show a message: "Please share this photo as JPEG and try again." (HEIC decoding in-browser is complex — punt on it for now. Most share workflows convert to JPEG anyway.)
        If the longest edge exceeds 4096px, downscale proportionally
        Create an object URL for display
        Store the file, object URL, and dimensions in the Zustand store
        Advance stage to 'perspective'
    Validation: reject files over 50MB. Warn if resolution is below 800×800.

Screen 2: Perspective Correction

The user marks the four corners of their quilt so the app can "straighten" the photo.

    Display the uploaded image filling the available space
    Overlay four draggable circular handles, one per corner (top-left, top-right, bottom-right, bottom-left)
    Handle size: at least 44×44 CSS pixels (touch-friendly)
    Handles should have high-contrast outlines (white fill, dark border, or similar) so they're visible on any quilt color

Auto-detection (attempt):
When this screen loads, send the image to the worker and have the worker:

    Convert to grayscale
    Run cv.Canny edge detection
    Run cv.HoughLinesP to find line segments
    Try to find the largest quadrilateral from the line intersections
    Return the four corners

If auto-detection finds a quadrilateral, pre-position the handles there. If it fails, place handles at 10% inset from the image corners.

The user can drag handles to adjust. On each handle release, show a small preview of what the warped result will look like (run the warp on a downscaled version for speed).

"Continue" button: When clicked:

    Send the four corner points to the worker
    Worker runs cv.getPerspectiveTransform and cv.warpPerspective on the full image
    Worker sends back the corrected image as ImageData
    Main thread creates an object URL from it, stores in correctedImageUrl
    Advance stage to 'calibrate'

Perspective warp details for the worker:

text

srcPoints = [TL, TR, BR, BL] (user's corner positions in pixels)
dstWidth = max(distance(TL,TR), distance(BL,BR))
dstHeight = max(distance(TL,BL), distance(TR,BR))
dstPoints = [[0,0], [dstWidth,0], [dstWidth,dstHeight], [0,dstHeight]]
M = cv.getPerspectiveTransform(srcPoints, dstPoints)
cv.warpPerspective(src, dst, M, new cv.Size(dstWidth, dstHeight))

Screen 3: Scale Calibration

The user tells the app the real-world size of something in the photo.

    Display the corrected image
    Instruction text: "Tap two points on the quilt and enter the distance between them"
    Two crosshair markers that the user places by clicking/tapping on the image
    A numeric input field for the distance
    A unit toggle: inches / cm
    Live readout: "1 inch = 47 pixels" (updates as user changes inputs)
    Calculation: pixelsPerUnit = pixelDistance(pointA, pointB) / enteredDistance
    Store pixelsPerUnit in the Zustand store
    "Analyze" button advances stage to 'review' and triggers the processing pipeline (sends process message to worker with quality: 'full')

What to Verify

    Upload works with JPEG from iPhone (rotated EXIF), PNG, WebP
    Large images (6000×4000) are downscaled without crashing
    Corner handles are draggable on both mouse and touch
    Perspective warp produces a rectangular output (test with a photo of a known rectangle)
    Calibration math is correct: if two points are 100px apart and user enters 2 inches, pixelsPerUnit should be 50
    Navigation between screens updates the store's stage correctly
    Back navigation doesn't lose data
