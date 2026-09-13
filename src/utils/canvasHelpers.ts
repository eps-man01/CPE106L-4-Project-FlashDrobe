import { getExifOrientation } from './exifOrientation';

/**
 * Corrects EXIF orientation by reading the file's orientation metadata
 * and redrawing the image to a canvas with the appropriate transforms.
 * Returns a corrected data URL.
 *
 * Mobile phone cameras store photos with the raw sensor data in landscape
 * orientation but include EXIF metadata indicating the intended display
 * rotation. Canvas drawImage() ignores this metadata, causing portrait
 * photos to appear sideways. This function corrects that.
 */
export function correctImageOrientation(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const orientation = getExifOrientation(arrayBuffer);

        // Orientation 1 = normal, no correction needed
        if (orientation === 1) {
          // Re-read as data URL for the original path
          const fallbackReader = new FileReader();
          fallbackReader.onload = (e) => resolve(e.target?.result as string);
          fallbackReader.onerror = () => reject(new Error('Failed to read file'));
          fallbackReader.readAsDataURL(file);
          return;
        }

        const blob = new Blob([arrayBuffer], { type: file.type });
        const objectUrl = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
          try {
            const corrected = applyOrientationToCanvas(img, orientation);
            URL.revokeObjectURL(objectUrl);
            resolve(corrected);
          } catch {
            URL.revokeObjectURL(objectUrl);
            // Fallback: return original
            const fb = new FileReader();
            fb.onload = (e) => resolve(e.target?.result as string);
            fb.onerror = () => reject(new Error('Failed to read file'));
            fb.readAsDataURL(file);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          const fb = new FileReader();
          fb.onload = (e) => resolve(e.target?.result as string);
          fb.onerror = () => reject(new Error('Failed to read file'));
          fb.readAsDataURL(file);
        };
        img.src = objectUrl;
      } catch {
        const fb = new FileReader();
        fb.onload = (e) => resolve(e.target?.result as string);
        fb.onerror = () => reject(new Error('Failed to read file'));
        fb.readAsDataURL(file);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Applies EXIF orientation transforms when drawing an image to canvas.
 * Returns a JPEG data URL with the corrected orientation.
 */
export function applyOrientationToCanvas(
  img: HTMLImageElement,
  orientation: number
): string {
  const { naturalWidth: w, naturalHeight: h } = img;

  // For orientations 5-8, the width and height are swapped
  const isSwapped = orientation >= 5 && orientation <= 8;
  const canvasWidth = isSwapped ? h : w;
  const canvasHeight = isSwapped ? w : h;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  switch (orientation) {
    case 2: // Flip horizontal
      ctx.translate(canvasWidth, 0);
      ctx.scale(-1, 1);
      break;
    case 3: // Rotate 180°
      ctx.translate(canvasWidth, canvasHeight);
      ctx.rotate(Math.PI);
      break;
    case 4: // Flip vertical
      ctx.translate(0, canvasHeight);
      ctx.scale(1, -1);
      break;
    case 5: // Transpose: flip horizontal + rotate 270° CW
      ctx.translate(canvasWidth, 0);
      ctx.scale(-1, 1);
      ctx.rotate(Math.PI / 2);
      break;
    case 6: // Rotate 90° CW
      ctx.translate(canvasWidth, 0);
      ctx.rotate(Math.PI / 2);
      break;
    case 7: // Transverse: flip horizontal + rotate 90° CW
      ctx.translate(0, canvasHeight);
      ctx.scale(1, -1);
      ctx.rotate(Math.PI / 2);
      break;
    case 8: // Rotate 270° CW (90° CCW)
      ctx.translate(0, canvasHeight);
      ctx.rotate(-Math.PI / 2);
      break;
    default: // 1 = normal
      break;
  }

  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Corrects EXIF orientation from a data URL string.
 * Reads the EXIF bytes from the base64-encoded data and redraws with correct orientation.
 */
export function correctDataUrlOrientation(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    // Extract the base64 part and decode to ArrayBuffer for EXIF reading
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) {
      resolve(dataUrl);
      return;
    }

    const base64 = dataUrl.slice(commaIdx + 1);
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const orientation = getExifOrientation(bytes.buffer);

    if (orientation === 1) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const corrected = applyOrientationToCanvas(img, orientation);
        resolve(corrected);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
