import { describe, expect, it } from "vitest";

import { readPngMetadata } from "@/lib/png";

const ONE_BY_ONE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3Z5VQAAAAASUVORK5CYII=";

function oneByOnePngBytes() {
  return new Uint8Array(Buffer.from(ONE_BY_ONE_PNG_BASE64, "base64"));
}

describe("png metadata parser", () => {
  it("reads width and height from IHDR", () => {
    const metadata = readPngMetadata(oneByOnePngBytes());
    expect(metadata).toEqual({ width: 1, height: 1 });
  });

  it("rejects invalid signatures", () => {
    const bytes = oneByOnePngBytes();
    bytes[0] = 0x00;
    expect(() => readPngMetadata(bytes)).toThrowError("INVALID_PNG_SIGNATURE");
  });

  it("rejects malformed IHDR chunk", () => {
    const bytes = oneByOnePngBytes();
    bytes[12] = 0x49;
    bytes[13] = 0x44;
    bytes[14] = 0x41;
    bytes[15] = 0x54;
    expect(() => readPngMetadata(bytes)).toThrowError("INVALID_PNG_IHDR");
  });
});
