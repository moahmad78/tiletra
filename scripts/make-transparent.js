const fs = require('fs');
const zlib = require('zlib');

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }

  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([len, typeAndData, crc]);
}

function unfilterScanlines(decompressed, width, height, bpp) {
  const rawBytes = Buffer.alloc(width * height * bpp);
  const srcStride = 1 + width * bpp;

  for (let y = 0; y < height; y++) {
    const filterType = decompressed[y * srcStride];
    const srcRow = decompressed.slice(y * srcStride + 1, (y + 1) * srcStride);
    const dstRowStart = y * width * bpp;

    for (let x = 0; x < width * bpp; x++) {
      const cur = srcRow[x];
      const a = x >= bpp ? rawBytes[dstRowStart + x - bpp] : 0;
      const b = y > 0 ? rawBytes[(y - 1) * width * bpp + x] : 0;
      const c = (y > 0 && x >= bpp) ? rawBytes[(y - 1) * width * bpp + x - bpp] : 0;

      let val = 0;
      if (filterType === 0) {
        val = cur;
      } else if (filterType === 1) {
        val = (cur + a) & 0xff;
      } else if (filterType === 2) {
        val = (cur + b) & 0xff;
      } else if (filterType === 3) {
        val = (cur + Math.floor((a + b) / 2)) & 0xff;
      } else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        let pr = 0;
        if (pa <= pb && pa <= pc) pr = a;
        else if (pb <= pc) pr = b;
        else pr = c;
        val = (cur + pr) & 0xff;
      }
      rawBytes[dstRowStart + x] = val;
    }
  }
  return rawBytes;
}

function convertRgbToTransparentPng(srcPath, destPath, threshold = 245) {
  console.log(`Processing: ${srcPath} -> ${destPath}`);
  const buf = fs.readFileSync(srcPath);

  let pos = 8;
  let ihdr = null;
  let idatBuffers = [];

  while (pos < buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.slice(pos + 8, pos + 8 + length);
    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
      };
    } else if (type === 'IDAT') {
      idatBuffers.push(data);
    }
    pos += 12 + length;
  }

  const { width, height, colorType } = ihdr;
  const decompressed = zlib.inflateSync(Buffer.concat(idatBuffers));
  const bpp = colorType === 6 ? 4 : 3;
  const rawRgb = unfilterScanlines(decompressed, width, height, bpp);

  // Generate filtered RGBA scanlines (Filter 0 = None)
  const rgbaScanlineLen = 1 + width * 4;
  const rgbaBuffer = Buffer.alloc(rgbaScanlineLen * height);

  for (let y = 0; y < height; y++) {
    const dstRow = y * rgbaScanlineLen;
    rgbaBuffer[dstRow] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * bpp;
      const r = rawRgb[srcIdx];
      const g = rawRgb[srcIdx + 1];
      const b = rawRgb[srcIdx + 2];

      const dstIdx = dstRow + 1 + x * 4;

      // Check if near white
      const isWhite = r >= threshold && g >= threshold && b >= threshold;
      // Smooth alpha for antialiasing edges
      let alpha = 255;
      if (isWhite) {
        alpha = 0;
      } else {
        const brightness = (r + g + b) / 3;
        if (brightness > threshold - 20) {
          // Soft transition
          alpha = Math.max(0, Math.min(255, Math.round((threshold - brightness) * (255 / 20))));
        }
      }

      rgbaBuffer[dstIdx] = r;
      rgbaBuffer[dstIdx + 1] = g;
      rgbaBuffer[dstIdx + 2] = b;
      rgbaBuffer[dstIdx + 3] = alpha;
    }
  }

  // Compress RGBA
  const compressedIdat = zlib.deflateSync(rgbaBuffer, { level: 9 });

  // Build new IHDR chunk for RGBA (ColorType 6)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // ColorType 6 (RGBA)
  ihdrData[10] = 0; // Deflate compression
  ihdrData[11] = 0; // Filter standard
  ihdrData[12] = 0; // No interlace

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressedIdat);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const outBuf = Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(destPath, outBuf);
  console.log(`Saved transparent PNG: ${destPath} (${outBuf.length} bytes)`);
}

// Backup original files first if not already backed up
const files = [
  'public/Tiletra/logo/web-logo.png',
  'public/Tiletra/logo/logo.png',
  'public/Tiletra/logo/icon.png',
  'public/Tiletra/vishal-web.png',
  'public/Tiletra/visal.png',
  'public/Tiletra/vishal-icon.png'
];

files.forEach((f) => {
  if (fs.existsSync(f)) {
    const backup = f.replace('.png', '.original.png');
    if (!fs.existsSync(backup)) {
      fs.copyFileSync(f, backup);
      console.log(`Backed up original to: ${backup}`);
    }
    convertRgbToTransparentPng(backup, f, 246);
  }
});
