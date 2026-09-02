// Pure Node script to generate valid PNG icon files from SVG/raw pixels without external dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createSolidPNG(width, height, r, g, b, a = 255) {
  // Raw scanlines: width * 4 bytes + 1 filter byte (0) per scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      
      // Calculate distance from center for a rounded app-icon badge effect
      const cx = width / 2;
      const cy = height / 2;
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const radius = width * 0.42;

      // Rounded rect check
      const cornerRadius = width * 0.22;
      const innerX = Math.max(0, dx - (cx - cornerRadius));
      const innerY = Math.max(0, dy - (cy - cornerRadius));
      const distFromCorner = Math.sqrt(innerX * innerX + innerY * innerY);
      
      if (distFromCorner > cornerRadius) {
        // Transparent outside rounded rect
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      } else {
        // Brand teal gradient
        const t = y / height;
        const red = Math.round(15 * (1 - t) + 4 * t);
        const green = Math.round(118 * (1 - t) + 47 * t);
        const blue = Math.round(110 * (1 - t) + 46 * t);

        // Simple center wallet symbol geometry
        const wx = (x / width) * 100;
        const wy = (y / height) * 100;
        const isWalletBody = wx >= 25 && wx <= 75 && wy >= 35 && wy <= 70;
        const isWalletLock = wx >= 60 && wx <= 78 && wy >= 46 && wy <= 58;

        if (isWalletLock) {
          rawData[pxOffset] = 251; // Gold #FBBF24
          rawData[pxOffset + 1] = 191;
          rawData[pxOffset + 2] = 36;
          rawData[pxOffset + 3] = 255;
        } else if (isWalletBody) {
          rawData[pxOffset] = 255; // White
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = red;
          rawData[pxOffset + 1] = green;
          rawData[pxOffset + 2] = blue;
          rawData[pxOffset + 3] = 255;
        }
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression: Deflate
  ihdrData[11] = 0; // Filter: Standard
  ihdrData[12] = 0; // Interlace: None

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = calculateCRC(chunk.slice(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

function calculateCRC(buf) {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c >>> 0;
  }

  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createSolidPNG(192, 192, 15, 118, 110));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createSolidPNG(512, 512, 15, 118, 110));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createSolidPNG(180, 180, 15, 118, 110));
console.log('PNG Icons successfully generated in /public');
