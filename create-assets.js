const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function solidPNG(w, h, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0);
  ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB

  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(1 + w * 3);
    row[0] = 0; // filter type: None
    for (let x = 0; x < w; x++) {
      row[1 + x * 3] = r;
      row[2 + x * 3] = g;
      row[3 + x * 3] = b;
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw, { level: 1 });

  const crcTable = new Uint32Array(256).map((_, i) => {
    let x = i;
    for (let j = 0; j < 8; j++) x = x & 1 ? 0xedb88320 ^ (x >>> 1) : x >>> 1;
    return x;
  });

  function crc32(buf) {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const tb = Buffer.from(type);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([tb, data])));
    return Buffer.concat([len, tb, data, crcBuf]);
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

// App icon: 1024x1024, Little Bloom green (#3DAA6F)
fs.writeFileSync(path.join(assetsDir, 'icon.png'), solidPNG(1024, 1024, 61, 170, 111));
console.log('✓ icon.png');

// Adaptive icon foreground: 1024x1024 green
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), solidPNG(1024, 1024, 61, 170, 111));
console.log('✓ adaptive-icon.png');

// Splash screen: 1284x2778, light mint (#F0FAF4)
fs.writeFileSync(path.join(assetsDir, 'splash.png'), solidPNG(1284, 2778, 240, 250, 244));
console.log('✓ splash.png');

// Favicon: 32x32
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), solidPNG(32, 32, 61, 170, 111));
console.log('✓ favicon.png');

console.log('\nAll assets created successfully!');
