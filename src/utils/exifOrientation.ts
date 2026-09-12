/**
 * Reads EXIF orientation (1-8) from a JPEG file's ArrayBuffer.
 * Parses the APP1 marker to find IFD0 orientation tag.
 * Returns 1 (normal) if no EXIF or orientation tag found.
 */
export function getExifOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);

  // JPEG starts with 0xFFD8
  if (view.getUint16(0, false) !== 0xFFD8) {
    return 1;
  }

  let offset = 2;
  const length = view.byteLength;

  while (offset < length) {
    if (offset + 4 > length) break;

    const marker = view.getUint16(offset, false);
    offset += 2;

    // APP1 marker (0xFFE1)
    if (marker === 0xFFE1) {
      const segmentLength = view.getUint16(offset, false);
      // Check for "Exif\0\0" header
      if (offset + 8 <= length) {
        const exifHeader = String.fromCharCode(
          view.getUint8(offset + 2),
          view.getUint8(offset + 3),
          view.getUint8(offset + 4),
          view.getUint8(offset + 5)
        );
        if (exifHeader === 'Exif') {
          return parseExifTiff(view, offset + 6);
        }
      }
      offset += segmentLength;
    } else if ((marker & 0xFF00) === 0xFF00) {
      const segmentLength = view.getUint16(offset, false);
      offset += segmentLength;
    } else {
      break;
    }
  }

  return 1;
}

function parseExifTiff(view: DataView, tiffStart: number): number {
  if (tiffStart + 8 > view.byteLength) return 1;

  const byteOrder = view.getUint16(tiffStart, false);
  const littleEndian = byteOrder === 0x4949; // "II" = little-endian

  // IFD0 offset
  const ifd0Offset = tiffStart + view.getUint32(tiffStart + 4, littleEndian);

  return findOrientationTag(view, tiffStart, ifd0Offset, littleEndian);
}

function findOrientationTag(view: DataView, tiffStart: number, ifdOffset: number, littleEndian: boolean): number {
  if (ifdOffset + 2 > view.byteLength) return 1;

  const entryCount = view.getUint16(ifdOffset, littleEndian);

  for (let i = 0; i < entryCount; i++) {
    const entryPos = ifdOffset + 2 + (i * 12);
    if (entryPos + 12 > view.byteLength) break;

    const tag = view.getUint16(entryPos, littleEndian);

    // Orientation tag = 0x0112
    if (tag === 0x0112) {
      const value = view.getUint16(entryPos + 8, littleEndian);
      return Math.min(Math.max(value, 1), 8);
    }
  }

  return 1;
}
