# Build Guide

## Quick Reference

```bash
# Development (with HMR)
bun dev                     # Start dev server on http://localhost:3000

# Production build
bun run build              # Build to dist/ directory
bun run start:dist         # Run production build

# Docker
docker-compose up --build  # Build and run in container
```

## Build Process

### Development Mode

When you run `bun dev`, Bun.serve:

1. Imports `public/index.html`
2. Scans for `<script>` and `<link>` tags
3. Bundles `frontend/main.tsx` and CSS on-the-fly
4. Enables Hot Module Reloading (HMR)
5. Streams browser console logs to terminal

### Production Build

When you run `bun run build`, the build process:

1. Runs `prebuild` script to reset `public/index.html` to clean state
2. Processes `backend/server.ts` (entry point)
3. Detects HTML import of `public/index.html`
4. Bundles all frontend assets (TypeScript, JSX, CSS)
5. Generates content-addressable filenames (e.g., `index-p3wn1rac.js`)
6. Modifies `public/index.html` with hashed asset references (this is expected)
7. Creates optimized output in `dist/`:
   - `server.js` - Backend server bundle
   - `index-[hash].js` - Frontend JavaScript bundle
   - `index-[hash].css` - CSS bundle

**Note**: The `prebuild` script automatically resets the HTML before each build, ensuring consistent builds.

### Build Output

```
dist/
├── server.js              # Backend server (87 KB)
├── index-[hash].js        # Frontend bundle (181 KB)
└── index-[hash].css       # CSS bundle (153 KB)
```

## Important Notes

### TailwindCSS v4 Warnings

You'll see warnings like:

```
warn: invalid @ rule encountered: '@theme'
warn: invalid @ rule encountered: '@utility'
```

These are **expected and harmless**. Bun's CSS parser doesn't recognize TailwindCSS v4 syntax yet, but the CSS still processes correctly. The warnings can be safely ignored.

### HTML File Modification

**Important**: Bun modifies `public/index.html` during the build process to inject bundled asset references. This is expected behavior.

The `prebuild` script (`scripts/prepare-build.ts`) automatically resets the HTML file before each build, so you don't need to manually restore it. The file in git should look like:

```html
<!-- Source version (in git) -->
<link rel="stylesheet" href="../frontend/index.css" />
<script type="module" src="../frontend/main.tsx"></script>

<!-- Build-modified version (after build, don't commit) -->
<link rel="stylesheet" href="../syslogger/index-[hash].css" />
<script type="module" src="../syslogger/index-[hash].js"></script>
```

If you need to manually restore it:

```bash
git checkout public/index.html
# or
bun scripts/prepare-build.ts
```

### Clean Builds

If you encounter build issues:

```bash
# Clean and rebuild
rm -rf dist/
bun run build
```

## Production Deployment

### Option 1: Direct Deployment

```bash
# On your server
git pull
bun install
bun run build
NODE_ENV=production bun run start:dist
```

### Option 2: Docker Deployment

```bash
# Build and run
docker-compose up --build -d

# View logs
docker-compose logs -f syslogger

# Stop
docker-compose down
```

## Troubleshooting

### Build fails with "Could not resolve"

**Problem**: HTML file has cached/generated asset references

**Solution**:

```bash
git checkout public/index.html
bun run build
```

### CSS not loading in production

**Problem**: Asset paths might be incorrect

**Solution**: Check that `dist/` contains the CSS file with a hash in the name

### HMR not working in development

**Problem**: Development mode might not be enabled

**Solution**: Check `backend/server.ts` has `development: { hmr: true }`

## Performance

### Build Times

- Development: Instant (on-the-fly bundling)
- Production: ~22ms for full bundle
- Docker: ~2-3 minutes (multi-stage build)

### Bundle Sizes

- Backend: 87 KB
- Frontend JS: 181 KB
- CSS: 153 KB
- **Total**: ~421 KB (uncompressed)

With gzip, expect ~40-50% size reduction.

## Advanced Configuration

### Custom Bundler Plugins

Add plugins in `bunfig.toml`:

```toml
[serve.static]
plugins = ["./my-plugin.ts"]
```

### Environment Variables

For production builds that need env vars:

```toml
[serve.static]
env = "PUBLIC_*"  # Only inline PUBLIC_* prefixed vars
```

### Minification Control

Minification is automatic in production builds. To disable:

```bash
bun build --target=bun --outdir=dist ./backend/server.ts
# (no --production flag = no minification)
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build
        run: bun run build

      - name: Deploy
        run: bun run start:dist
```

## See Also

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [AGENTS.md](./AGENTS.md) - Architecture overview
- [Bun Docs](https://bun.sh/docs/bundler) - Bun bundler documentation
