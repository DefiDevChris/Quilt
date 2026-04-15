Photo-to-Design Build Prompts
How to Use These Prompts

There are 7 sections below. Each is a self-contained prompt for a coding agent. They are ordered — each builds on what the previous one produced. Give them to your agent one at a time, in order.

What you're building: A Next.js feature that takes a photo of a quilt, uses classical image processing (OpenCV) to find every fabric patch, cleans up the geometry, and drops editable vector outlines into a design studio. Everything runs in the browser. No server. No AI models.
PROMPT 1 — Project Setup & Infrastructure
Context

You are building a "Photo-to-Design" feature inside an existing Next.js 15 (App Router) / React 19 app. This feature will process quilt photos entirely in the browser using OpenCV.js running in a Web Worker.

Before any UI or processing logic, we need the foundation: the OpenCV build, the worker scaffold, memory management, the state store, and the message protocol between the main thread and the worker.
What to Build

1. Custom OpenCV.js Build

The default opencv.js is 8+ MB and includes deep learning modules we don't need.

Create a build script or document the exact Emscripten build command that compiles OpenCV.js with ONLY these modules enabled:

    core
    imgproc

Target output size: 3–4 MB. The build should produce a single .js file loadable in a Web Worker via importScripts() or dynamic import.

If a custom build is too complex for your environment, use the standard opencv.js but document the intended custom build for later optimization. Either way, verify these functions work: cv.bilateralFilter, cv.kmeans, cv.connectedComponents, cv.findContours, cv.approxPolyDP, cv.Canny, cv.CLAHE, cv.getPerspectiveTransform, cv.warpPerspective, cv.cvtColor, cv.GaussianBlur, cv.split, cv.merge, cv.morphologyEx. 2. Web Worker Scaffold

Create worker.ts (or worker.js). It should:

    Load OpenCV.js on init and post { type: 'ready' } when loaded
    Accept messages and route them to handler functions
    Catch all errors and post them back as error messages
    Never let an unhandled exception kill the worker silently

3. MatRegistry (Memory Manager)

OpenCV.js allocates matrices on the WASM heap. They are NOT garbage collected. Every new cv.Mat() leaks memory unless you call .delete().

Build a MatRegistry class used inside the worker:

typescript

class MatRegistry {
private mats: Map<string, any> = new Map();

create(name: string, ...args: any[]): any {
// Create a cv.Mat, store it by name, return it
}

get(name: string): any {
// Return the mat by name
}

delete(name: string): void {
// Call .delete() on the mat and remove from map
}

deleteAll(): void {
// Call .delete() on every mat, clear the map
}
}

Every pipeline function must use this registry. At the end of every processing run, deleteAll() must be called. 4. Zustand Store

Create usePhotoDesignStore.ts with this state shape:

typescript

interface PhotoDesignState {
stage: 'upload' | 'perspective' | 'calibrate' | 'review' | 'export';

sourceFile: File | null;
sourceObjectUrl: string | null;
sourceDimensions: { width: number; height: number } | null;

corners: [Point, Point, Point, Point] | null;
correctedImageUrl: string | null;

calibrationPoints: [Point, Point] | null;
calibrationDistance: number;
calibrationUnit: 'in' | 'cm';
pixelsPerUnit: number | null;

sliders: {
lighting: number; // 0–100
smoothing: number; // 0–100
heavyPrints: boolean;
colors: number; // 0=auto, 1–100
minPatchSize: number; // 0–100
edgeEnhance: boolean;
edgeSensitivity: number; // 0–100
gridSnap: number; // 0–100
};

isProcessing: boolean;
processingStage: string;
processingPercent: number;

viewMode: 'photo+outlines' | 'colorFill' | 'outlinesOnly' | 'photoOnly';
previewOutlines: Float32Array | null;
previewColors: string[] | null;
previewPatchCount: number;

patches: Patch[] | null;
templates: ShapeTemplate[] | null;
grid: DetectedGrid | null;

selectedPatchId: number | null;
hoveredPatchId: number | null;
activeTool: 'select' | 'drawSeam' | 'eraseSeam' | 'floodFill' | null;
canUndo: boolean;
canRedo: boolean;
}

Include all necessary actions (setters, tool selection, dispose). The dispose action must terminate the worker and revoke any object URLs. 5. Message Protocol

Define the message types for worker communication:

Main thread sends to worker:

    init — load OpenCV
    loadImage — send an ImageData of the corrected image
    process — run pipeline with params and quality (preview or full)
    splitPatch — split a patch along a drawn line
    mergePatches — merge two patches
    floodFill — reassign a clicked region
    undo / redo
    dispose — free everything

Worker sends back:

    ready — OpenCV loaded
    progress — stage name + percent
    previewResult — outlines as Float32Array + colors array + patch count
    fullResult — full Patch array + templates + grid info
    editResult — updated patches after a manual edit
    error — message + which stage + whether it's recoverable
    undoRedoState — canUndo + canRedo booleans

Write a typed wrapper (a small class or set of functions) on the main-thread side that sends messages to the worker and dispatches incoming messages to update the Zustand store. Debounce process messages with quality: 'preview' to 100ms so rapid slider drags don't flood the worker. 6. Shared Type Definitions

Create a shared types file used by both the worker and the main thread:

typescript

interface Point { x: number; y: number }

interface Patch {
id: number;
templateId: string;
polygon: Point[]; // real-world coordinates
pixelPolygon: Point[]; // pixel coordinates for canvas overlay
svgPath: string; // "M x,y L x,y ... Z"
centroid: Point;
area: number;
vertexCount: number;
dominantColor: string; // hex
colorPalette: [string, string, string];
fabricSwatch: string; // PNG data URL
neighbors: number[];
}

interface ShapeTemplate {
id: string;
name: string;
normalizedPolygon: Point[];
realWorldSize: { w: number; h: number };
instanceCount: number;
instanceIds: number[];
}

interface DetectedGrid {
type: 'rectangular' | 'triangular' | 'hexagonal' | 'none';
dominantAngles: number[];
spacings: { angle: number; spacing: number }[];
confidence: number;
}

What to Verify

    Worker initializes, loads OpenCV, posts ready
    MatRegistry creates and deletes mats without memory leaks (create 100, deleteAll, create 100 more — WASM heap should not grow)
    Store initializes with defaults
    Message round-trip works: main thread sends init, worker responds ready, store updates
    Debounced process messages: dragging a slider rapidly sends only 1 message per 100ms
