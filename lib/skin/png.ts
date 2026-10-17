import "server-only";
import { createHash } from "node:crypto";
import { deflateSync, inflateSync } from "node:zlib";
import { RequestError } from "@/lib/http/request";
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function crc32(data: Buffer) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer) {
  const name = Buffer.from(type, "ascii");
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length);
  name.copy(result, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([name, data])), result.length - 4);
  return result;
}
// Deliberately small PNG subset: 8-bit RGB/RGBA, non-interlaced 64x32 or 64x64.
// Validate CRC and decompressed scanlines; remove ancillary data on re-encoding.
export function normalizeSkin(bytes: Buffer, model: "classic" | "slim") {
  const invalid = () =>
    new RequestError(
      400,
      "Use a valid 64×64 PNG (classic skins may also use 64×32).",
    );
  if (bytes.length > 256 * 1024 || !bytes.subarray(0, 8).equals(signature))
    throw invalid();
  let offset = 8;
  let header: Buffer | undefined;
  let ended = false;
  let idatClosed = false;
  const compressed: Buffer[] = [];
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    if (length > bytes.length - offset - 12) throw invalid();
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (
      crc32(bytes.subarray(offset + 4, offset + 8 + length)) !==
      bytes.readUInt32BE(offset + 8 + length)
    )
      throw invalid();
    if (!header && type !== "IHDR") throw invalid();
    if (type === "IHDR") {
      if (header || offset !== 8 || length !== 13) throw invalid();
      header = Buffer.from(data);
    } else if (type === "IDAT") {
      if (idatClosed) throw invalid();
      compressed.push(data);
    } else if (type === "IEND") {
      if (length || !compressed.length) throw invalid();
      ended = true;
      offset += length + 12;
      break;
    } else {
      if (compressed.length) idatClosed = true;
      // No animation, unknown critical chunks, or palette-based images.
      if (
        !/^[a-z][A-Za-z]{3}$/.test(type) ||
        type === "acTL" ||
        type === "fcTL" ||
        type === "fdAT"
      )
        throw invalid();
    }
    offset += length + 12;
  }
  if (!ended || offset !== bytes.length || !header) throw invalid();
  const width = header.readUInt32BE(0);
  const height = header.readUInt32BE(4);
  const color = header[9];
  if (
    width !== 64 ||
    ![32, 64].includes(height) ||
    (model === "slim" && height !== 64) ||
    header[8] !== 8 ||
    ![2, 6].includes(color) ||
    header[10] ||
    header[11] ||
    header[12]
  )
    throw invalid();
  const stride = width * (color === 6 ? 4 : 3) + 1;
  let pixels: Buffer;
  try {
    pixels = inflateSync(Buffer.concat(compressed), {
      maxOutputLength: height * stride,
    });
  } catch {
    throw invalid();
  }
  if (pixels.length !== height * stride) throw invalid();
  for (let row = 0; row < height; row++)
    if (pixels[row * stride] > 4) throw invalid();
  const png = Buffer.concat([
    signature,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return {
    pngBase64: png.toString("base64"),
    checksum: createHash("sha256").update(png).digest("hex"),
  };
}
