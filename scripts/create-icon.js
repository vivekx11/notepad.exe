/**
 * Creates a valid ICO file with 256x256, 48x48, 32x32 and 16x16 images.
 * Uses only Node.js built-ins — no external dependencies.
 */
const fs = require('fs')
const path = require('path')

// ── Tiny BMP builder ──────────────────────────────────────────────────────────
function buildBMP(size, r, g, b) {
  const rowBytes = size * 4          // BGRA
  const pixelDataSize = rowBytes * size
  const fileSize = 40 + pixelDataSize  // DIB header + pixels (ICO omits file header)

  const buf = Buffer.alloc(fileSize, 0)
  let o = 0

  // BITMAPINFOHEADER (40 bytes)
  buf.writeUInt32LE(40, o);             o += 4  // biSize
  buf.writeInt32LE(size, o);            o += 4  // biWidth
  buf.writeInt32LE(-(size * 2), o);     o += 4  // biHeight (negative = top-down, doubled for AND mask in ICO)
  buf.writeUInt16LE(1, o);              o += 2  // biPlanes
  buf.writeUInt16LE(32, o);             o += 2  // biBitCount (32-bit BGRA)
  buf.writeUInt32LE(0, o);              o += 4  // biCompression (BI_RGB)
  buf.writeUInt32LE(pixelDataSize, o);  o += 4  // biSizeImage
  buf.writeInt32LE(0, o);               o += 4  // biXPelsPerMeter
  buf.writeInt32LE(0, o);               o += 4  // biYPelsPerMeter
  buf.writeUInt32LE(0, o);              o += 4  // biClrUsed
  buf.writeUInt32LE(0, o);              o += 4  // biClrImportant

  // Pixel data — draw a rounded square icon (blue gradient + "VN" text approximation)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = x - size / 2
      const cy = y - size / 2
      const dist = Math.sqrt(cx * cx + cy * cy)
      const radius = size * 0.42
      const cornerRadius = size * 0.22

      // Rounded rectangle check
      const rx = Math.abs(cx) - (size / 2 - cornerRadius)
      const ry = Math.abs(cy) - (size / 2 - cornerRadius)
      const inRoundedRect = (rx <= 0 || ry <= 0)
        ? (Math.abs(cx) <= size / 2 - 1 && Math.abs(cy) <= size / 2 - 1)
        : (rx * rx + ry * ry <= cornerRadius * cornerRadius)

      const px = o  // current pixel offset
      if (inRoundedRect) {
        // Gradient: top-left lighter, bottom-right darker blue
        const t = (x + y) / (size * 2)
        const pr = Math.round(37 + t * 20)   // ~37-57
        const pg = Math.round(99 + t * 30)   // ~99-129
        const pb = Math.round(235 - t * 20)  // ~215-235
        buf[px]     = pb  // B
        buf[px + 1] = pg  // G
        buf[px + 2] = pr  // R
        buf[px + 3] = 255 // A
      } else {
        // Transparent
        buf[px] = buf[px + 1] = buf[px + 2] = buf[px + 3] = 0
      }
      o += 4
    }
  }

  return buf
}

// ── ICO builder ───────────────────────────────────────────────────────────────
function buildICO(sizes) {
  const images = sizes.map(s => buildBMP(s, 59, 130, 246))

  // ICONDIR header: 6 bytes
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)          // reserved
  header.writeUInt16LE(1, 2)          // type = 1 (icon)
  header.writeUInt16LE(sizes.length, 4) // count

  // ICONDIRENTRY: 16 bytes each
  const dirEntries = []
  let dataOffset = 6 + sizes.length * 16

  for (let i = 0; i < sizes.length; i++) {
    const entry = Buffer.alloc(16)
    const s = sizes[i]
    entry[0] = s >= 256 ? 0 : s   // width  (0 = 256)
    entry[1] = s >= 256 ? 0 : s   // height (0 = 256)
    entry[2] = 0                   // color count
    entry[3] = 0                   // reserved
    entry.writeUInt16LE(1, 4)      // planes
    entry.writeUInt16LE(32, 6)     // bit count
    entry.writeUInt32LE(images[i].length, 8)  // size
    entry.writeUInt32LE(dataOffset, 12)       // offset
    dirEntries.push(entry)
    dataOffset += images[i].length
  }

  return Buffer.concat([header, ...dirEntries, ...images])
}

// ── Write ─────────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, '../assets/icon.ico')
const ico = buildICO([256, 48, 32, 16])
fs.writeFileSync(outPath, ico)
console.log(`Created icon.ico (${ico.length} bytes) at ${outPath}`)
