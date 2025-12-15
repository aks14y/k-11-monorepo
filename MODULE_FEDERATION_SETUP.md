# Module Federation Setup Guide

This guide explains how to use Module Federation to expose inbox and monitoring as remotes that can be loaded from the same server (no CDN required).

## Architecture

- **Shell App**: The host application that loads remote modules
- **k11-inbox**: Exposed as a Module Federation remote (`remoteEntry.js`)
- **k11-monitoring**: Exposed as a Module Federation remote (`remoteEntry.js`)

## Building Remotes

Each remote module needs to be built to generate its `remoteEntry.js`:

```bash
# Build inbox remote
cd packages/k11-inbox
pnpm build:remote

# Build monitoring remote
cd packages/k11-monitoring
pnpm build:remote

# Or build all remotes from root
pnpm turbo run build:remote --filter=k11-inbox --filter=k11-monitoring
```

This generates:
- `packages/k11-inbox/dist/remoteEntry.js`
- `packages/k11-monitoring/dist/remoteEntry.js`

## Configuration

### Option 1: Local Paths (Same Server, No CDN)

In your `.env` or `.env.production` file:

```bash
# Use local paths - served from same server
REMOTE_INBOX_URL=/inbox/remoteEntry.js
REMOTE_MONITORING_URL=/monitoring/remoteEntry.js
```

The shell's webpack dev server is configured to serve these files from:
- `/inbox/remoteEntry.js` → `packages/k11-inbox/dist/remoteEntry.js`
- `/monitoring/remoteEntry.js` → `packages/k11-monitoring/dist/remoteEntry.js`

### Option 2: External URLs (Separate Servers/CDN)

```bash
# Use external URLs
REMOTE_INBOX_URL=https://customer-a.example.com/inbox/remoteEntry.js
REMOTE_MONITORING_URL=https://customer-a.example.com/monitoring/remoteEntry.js
```

### Option 3: Bundle Locally (Default)

```bash
# Leave empty to bundle locally
REMOTE_INBOX_URL=
REMOTE_MONITORING_URL=
```

## Production Deployment

For production, you need to:

1. **Build the remotes:**
   ```bash
   pnpm turbo run build:remote --filter=k11-inbox --filter=k11-monitoring
   ```

2. **Serve the remoteEntry.js files:**
   - Copy `packages/k11-inbox/dist/remoteEntry.js` to your server at `/inbox/remoteEntry.js`
   - Copy `packages/k11-monitoring/dist/remoteEntry.js` to your server at `/monitoring/remoteEntry.js`
   - Or configure your web server to serve from those directories

3. **Build the shell:**
   ```bash
   pnpm build --filter=shell
   ```

4. **Set environment variables:**
   ```bash
   REMOTE_INBOX_URL=/inbox/remoteEntry.js
   REMOTE_MONITORING_URL=/monitoring/remoteEntry.js
   ```

## Development

For development with remotes:

1. **Build remotes once:**
   ```bash
   pnpm turbo run build:remote --filter=k11-inbox --filter=k11-monitoring
   ```

2. **Update .env:**
   ```bash
   REMOTE_INBOX_URL=/inbox/remoteEntry.js
   REMOTE_MONITORING_URL=/monitoring/remoteEntry.js
   ```

3. **Start shell dev server:**
   ```bash
   pnpm dev:shell
   ```

The dev server will serve the remoteEntry.js files from the built packages.

## Benefits

- ✅ No CDN required - remotes served from same server
- ✅ Per-customer deployments - only build/serve needed remotes
- ✅ Independent versioning - each remote can be updated independently
- ✅ Shared dependencies - React, styled-components shared as singletons
- ✅ Fallback to local bundling - if remotes not configured, bundles locally

