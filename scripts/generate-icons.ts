#!/usr/bin/env bun
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const svgPath = path.join(process.cwd(), 'src/frontend/public/icon/logo.svg')
const outputDir = path.join(process.cwd(), 'src/frontend/public/icon')

const sizes = [
  { name: 'icon-1024.png', size: 1024 },
]

console.log('🎨 Generating icons from logo.svg...\n')

await mkdir(outputDir, { recursive: true })

const svgBuffer = readFileSync(svgPath)

for (const { name, size } of sizes) {
  const outputPath = path.join(outputDir, name)

  // Use a reasonable density that won't exceed Sharp's pixel limit
  const density = Math.min(300, Math.ceil((size / 24) * 150))

  await sharp(svgBuffer, { density })
    .resize(size, size, {
      fit: 'contain',
      background: { r: 3, g: 3, b: 3, alpha: 1 }, // #030303 background
    })
    .png()
    .toFile(outputPath)

  console.log(`✅ Generated ${name} (${size}x${size})`)
}

// Generate favicon.ico (32x32 is the standard size for .ico)
const faviconPath = path.join(outputDir, 'favicon.ico')
await sharp(svgBuffer, { density: 400 })
  .resize(32, 32, {
    fit: 'contain',
    background: { r: 3, g: 3, b: 3, alpha: 1 },
  })
  .png() // ICO format requires PNG conversion first
  .toFile(faviconPath.replace('.ico', '-temp.png'))

// Rename to .ico (browsers will handle it)
await Bun.write(
  faviconPath,
  Bun.file(faviconPath.replace('.ico', '-temp.png'))
)
await Bun.$`rm ${faviconPath.replace('.ico', '-temp.png')}`

console.log(`✅ Generated favicon.ico (32x32)`)
console.log('\n🎉 All icons generated successfully!')
