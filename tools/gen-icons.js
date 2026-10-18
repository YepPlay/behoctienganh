/* Sinh icon PNG placeholder cho app (nền xanh lá, chữ ABC trắng像素).
   Chạy: node tools/gen-icons.js
   Sau này có thể thay icon thật vào assets/images/ (cùng tên file). */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT = path.join(__dirname, "..", "assets", "images");

/* Font 5x7 cho A, B, C (bit từ trái sang phải, mỗi dòng 1 byte) */
const FONT = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
};

function crc32(buf) {
  let c, table = crc32.t;
  if (!table) {
    table = crc32.t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function makePNG(size) {
  /* Nền: gradient dọc xanh lá -> vàng nhạt; chữ ABC trắng ở giữa */
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    const t = y / (size - 1);
    const r = Math.round(67 + (251 - 67) * t * 0.85);
    const g = Math.round(160 + (192 - 160) * t);
    const b = Math.round(71 + (32 - 71) * t);
    for (let x = 0; x < size; x++) {
      row[1 + x * 3] = r; row[2 + x * 3] = g; row[3 + x * 3] = b;
    }
    rows.push(row);
  }

  /* Vẽ "ABC" trắng, block 5x7, scale lên ~40% chiều rộng */
  const scale = Math.max(1, Math.floor(size * 0.4 / (5 * 3 + 2 * 2)));
  const glyphW = 5 * scale, glyphH = 7 * scale, gap = 2 * scale;
  const totalW = glyphW * 3 + gap * 2;
  const x0 = Math.floor((size - totalW) / 2);
  const y0 = Math.floor((size - glyphH) / 2);
  ["A", "B", "C"].forEach((ch, gi) => {
    const bits = FONT[ch];
    const gx = x0 + gi * (glyphW + gap);
    for (let ry = 0; ry < 7; ry++) {
      for (let rx = 0; rx < 5; rx++) {
        if (!(bits[ry] & (1 << (4 - rx)))) continue;
        for (let sy = 0; sy < scale; sy++)
          for (let sx = 0; sx < scale; sx++) {
            const px = gx + rx * scale + sx, py = y0 + ry * scale + sy;
            const o = 1 + (py * size + px) * 3;
            const row = rows[py];
            row[o] = row[o + 1] = row[o + 2] = 255;
          }
      }
    }
  });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; /* 8-bit RGB */
  const idat = zlib.deflateSync(Buffer.concat(rows), { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(OUT, { recursive: true });
[32, 180, 192, 512].forEach(s => {
  const f = path.join(OUT, "icon-" + s + ".png");
  fs.writeFileSync(f, makePNG(s));
  console.log("  " + f + " (" + fs.statSync(f).size + " bytes)");
});
console.log("Xong — 4 icon PNG trong assets/images/");
