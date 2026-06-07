import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const BG = [0x0a, 0x0a, 0x0f]
const FG = [0x00, 0xff, 0x41]

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcInput = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcInput), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

// Draws a simple padlock glyph (matrix green) on a dark background
function pixelColor(x, y, size) {
  const cx = size / 2
  const cy = size * 0.56
  const bodyW = size * 0.46
  const bodyH = size * 0.34
  const bodyTop = cy - bodyH * 0.25
  const bodyBottom = cy + bodyH * 0.75

  const inBody =
    x > cx - bodyW / 2 &&
    x < cx + bodyW / 2 &&
    y > bodyTop &&
    y < bodyBottom

  // shackle (arc) - ring shape above the body
  const shackleCx = cx
  const shackleCy = bodyTop
  const outerR = size * 0.2
  const innerR = size * 0.12
  const dx = x - shackleCx
  const dy = y - shackleCy
  const dist = Math.sqrt(dx * dx + dy * dy)
  const inShackle = dist < outerR && dist > innerR && dy < size * 0.02

  // keyhole inside the body
  const khCx = cx
  const khCy = cy + bodyH * 0.15
  const khR = size * 0.045
  const khDist = Math.sqrt((x - khCx) ** 2 + (y - khCy) ** 2)
  const inKeyholeCircle = khDist < khR
  const inKeyholeStem =
    x > khCx - khR * 0.5 &&
    x < khCx + khR * 0.5 &&
    y > khCy &&
    y < khCy + khR * 1.8

  if (inKeyholeCircle || inKeyholeStem) return BG
  if (inBody || inShackle) return FG
  return BG
}

function buildPng(size) {
  const rowBytes = size * 3
  const raw = Buffer.alloc((rowBytes + 1) * size)
  for (let y = 0; y < size; y++) {
    const rowStart = y * (rowBytes + 1)
    raw[rowStart] = 0 // filter type: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelColor(x, y, size)
      const idx = rowStart + 1 + x * 3
      raw[idx] = r
      raw[idx + 1] = g
      raw[idx + 2] = b
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 2 // color type: truecolor (RGB)
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0

  const ihdr = chunk('IHDR', ihdrData)
  const idat = chunk('IDAT', deflateSync(raw))
  const iend = chunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

for (const size of [192, 512]) {
  const png = buildPng(size)
  const file = join(outDir, `icon-${size}.png`)
  writeFileSync(file, png)
  console.log(`Generated ${file} (${png.length} bytes)`)
}
