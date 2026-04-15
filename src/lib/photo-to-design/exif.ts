/**
 * Minimal EXIF orientation parser.
 * Reads the Orientation tag (0x0112) from JPEG files and returns the orientation value (1-8).
 * Returns 1 if no orientation tag found or not a JPEG.
 */
export async function readExifOrientation(file: File): Promise<number> {
  if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/jpg')) {
    return 1;
  }

  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);

  // JPEG SOI marker: 0xFFD8
  if (view.getUint16(0) !== 0xFFD8) {
    return 1;
  }

  const length = buffer.byteLength;
  let offset = 2;

  while (offset < length) {
    // Read marker
    if (view.getUint8(offset) !== 0xFF) {
      break;
    }

    const marker = view.getUint8(offset + 1);

    // APP1 marker (0xE1) contains EXIF
    if (marker === 0xE1) {
      // Check for "Exif\0\0" header
      const exifHeader = new TextDecoder().decode(
        new Uint8Array(buffer, offset + 4, 6),
      );
      if (exifHeader !== 'Exif\x00\x00') {
        return 1;
      }

      const tiffStart = offset + 10;
      const littleEndian = view.getUint16(tiffStart) === 0x4949;

      // Read IFD0 offset
      const ifd0Offset = view.getUint32(tiffStart + 4, littleEndian);
      const ifdStart = tiffStart + ifd0Offset;
      const numEntries = view.getUint16(ifdStart, littleEndian);

      // Search for Orientation tag (0x0112)
      for (let i = 0; i < numEntries; i++) {
        const entryOffset = ifdStart + 2 + i * 12;
        const tag = view.getUint16(entryOffset, littleEndian);

        if (tag === 0x0112) {
          return view.getUint16(entryOffset + 8, littleEndian);
        }
      }

      return 1;
    }

    // Skip non-APP1 markers
    if (marker === 0xFF) {
      offset++;
    } else {
      const size = view.getUint16(offset + 2);
      offset += 2 + size;
    }
  }

  return 1;
}

/**
 * Apply EXIF orientation rotation/flipping to an ImageBitmap.
 * Returns a new ImageBitmap with the correct orientation.
 * Orientation values: 1=normal, 3=180°, 6=90° CW, 8=90° CCW, etc.
 */
export async function applyExifOrientation(
  bitmap: ImageBitmap,
  orientation: number,
): Promise<ImageBitmap> {
  if (orientation === 1) return bitmap;

  const { width, height } = bitmap;
  let newWidth = width;
  let newHeight = height;

  // Orientations that swap width/height
  if ([5, 6, 7, 8].includes(orientation)) {
    newWidth = height;
    newHeight = width;
  }

  // OffscreenCanvas with Safari fallback
  let canvas: OffscreenCanvas | HTMLCanvasElement;
  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(newWidth, newHeight);
  } else {
    canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return bitmap;

  // Apply transforms based on orientation
  switch (orientation) {
    case 2:
      ctx.translate(newWidth, 0);
      ctx.scale(-1, 1);
      break;
    case 3:
      ctx.translate(newWidth, newHeight);
      ctx.rotate(Math.PI);
      break;
    case 4:
      ctx.translate(0, newHeight);
      ctx.scale(1, -1);
      break;
    case 5:
      ctx.rotate(Math.PI / 2);
      ctx.scale(1, -1);
      break;
    case 6:
      ctx.translate(newWidth, 0);
      ctx.rotate(Math.PI / 2);
      break;
    case 7:
      ctx.translate(newWidth, newHeight);
      ctx.rotate(Math.PI / 2);
      ctx.scale(-1, 1);
      break;
    case 8:
      ctx.translate(0, newHeight);
      ctx.rotate(-Math.PI / 2);
      break;
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  // Convert to ImageBitmap
  if (canvas instanceof OffscreenCanvas) {
    return canvas.transferToImageBitmap();
  } else {
    return createImageBitmap(canvas);
  }
}
