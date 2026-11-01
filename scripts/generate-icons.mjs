import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (truecolor RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw image data with filter byte 0 at start of each scanline
  const rawData = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 3 + 1);
    rawData.writeUInt8(0, rowOffset); // filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // create circular purple badge with center highlight
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const radius = width * 0.44;

      if (dist < radius) {
        // Kurd Chat purple / white icon center
        if (dist < radius * 0.45 && y > cy - radius * 0.2 && y < cy + radius * 0.4) {
          rawData.writeUInt8(255, pixelOffset);
          rawData.writeUInt8(255, pixelOffset + 1);
          rawData.writeUInt8(255, pixelOffset + 2);
        } else {
          rawData.writeUInt8(109, pixelOffset);
          rawData.writeUInt8(40, pixelOffset + 1);
          rawData.writeUInt8(217, pixelOffset + 2);
        }
      } else {
        // Dark background #0a0a0c
        rawData.writeUInt8(10, pixelOffset);
        rawData.writeUInt8(10, pixelOffset + 1);
        rawData.writeUInt8(12, pixelOffset + 2);
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuf, data]);
  const crc = crc32(crcData);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ 0xffffffff;
}

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192, 109, 40, 217));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512, 109, 40, 217));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, 109, 40, 217));
console.log('PWA PNG Icons generated successfully!');
