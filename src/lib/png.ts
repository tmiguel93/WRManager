const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export interface PngMetadata {
  width: number;
  height: number;
}

function readUInt32BigEndian(bytes: Uint8Array, offset: number) {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0;
}

export function readPngMetadata(bytes: Uint8Array): PngMetadata {
  if (bytes.length < 33) {
    throw new Error("INVALID_PNG_HEADER");
  }

  for (let index = 0; index < PNG_SIGNATURE.length; index += 1) {
    if (bytes[index] !== PNG_SIGNATURE[index]) {
      throw new Error("INVALID_PNG_SIGNATURE");
    }
  }

  const chunkLength = readUInt32BigEndian(bytes, 8);
  const chunkType = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (chunkType !== "IHDR" || chunkLength < 8) {
    throw new Error("INVALID_PNG_IHDR");
  }

  const width = readUInt32BigEndian(bytes, 16);
  const height = readUInt32BigEndian(bytes, 20);

  if (width <= 0 || height <= 0) {
    throw new Error("INVALID_PNG_DIMENSIONS");
  }

  return { width, height };
}
