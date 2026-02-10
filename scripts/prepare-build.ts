#!/usr/bin/env bun

/**
 * Pre-build script to ensure public/index.html is in the correct state
 * before running the build. This prevents issues with Bun modifying the
 * HTML file during builds.
 */

export {}

const htmlTemplate = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Syslogger</title>
    <meta name="theme-color" content="#000000" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta
      name="apple-mobile-web-app-status-bar-style"
      content="black-translucent" />
    <link rel="stylesheet" href="../frontend/index.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="../frontend/main.tsx"></script>
  </body>
</html>
`

const htmlPath = './public/index.html'

try {
  await Bun.write(htmlPath, htmlTemplate)
  console.log('✓ Reset public/index.html to clean state')
} catch (error) {
  console.error('✗ Failed to reset HTML file:', error)
  process.exit(1)
}
