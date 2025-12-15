# Environment Variables Configuration

## Overview

This document explains all environment variables used by the Shell app and when they're needed.

## File Locations

- **Development**: `.env` (create this file in `apps/shell/`)
- **Production**: `.env.production` (create this file in `apps/shell/`)
- **Template**: See `.env.example` section below

## Required Variables

### `PORT` (Optional)
- **Default**: `3000`
- **Description**: Port for webpack dev server
- **Example**: `PORT=3000`

## Feature Module Flags

### `ENABLE_K11_INBOX` (Optional)
- **Default**: `true`
- **Description**: Control whether k11-inbox module is available in the UI
- **Set to**: `false` to disable (compile-time exclusion)
- **Example**: `ENABLE_K11_INBOX=true`

### `ENABLE_K11_MONITORING` (Optional)
- **Default**: `true`
- **Description**: Control whether k11-monitoring module is available in the UI
- **Set to**: `false` to disable (compile-time exclusion)
- **Example**: `ENABLE_K11_MONITORING=true`

## Module Federation Remote URLs (OPTIONAL)

### `REMOTE_INBOX_URL` (Optional)
- **Default**: Empty/unset
- **Description**: URL to k11-inbox remoteEntry.js for **build-time remotes**
- **When needed**: Only if using build-time remotes (static configuration)
- **When NOT needed**: 
  - ✅ **Docker/CDN architecture** - URLs come from backend API (`/api/plugins`)
  - ✅ Local bundling - modules bundled directly
- **Example**: `REMOTE_INBOX_URL=https://customer-a.example.com/inbox/remoteEntry.js`

### `REMOTE_MONITORING_URL` (Optional)
- **Default**: Empty/unset
- **Description**: URL to k11-monitoring remoteEntry.js for **build-time remotes**
- **When needed**: Only if using build-time remotes (static configuration)
- **When NOT needed**: 
  - ✅ **Docker/CDN architecture** - URLs come from backend API (`/api/plugins`)
  - ✅ Local bundling - modules bundled directly
- **Example**: `REMOTE_MONITORING_URL=https://customer-a.example.com/monitoring/remoteEntry.js`

## Example .env Files

### Development (.env)

```bash
# Port for webpack dev server
PORT=3000

# Feature Module Flags
ENABLE_K11_INBOX=true
ENABLE_K11_MONITORING=true

# Module Federation Remote URLs (OPTIONAL - Build-Time Remotes)
# NOTE: For Docker/CDN architecture, these are NOT needed!
# URLs come from your Java backend API (/api/plugins) at runtime.
# Leave empty to use runtime remotes from backend API.

# REMOTE_INBOX_URL=
# REMOTE_MONITORING_URL=

# Examples (only if using build-time remotes):
# REMOTE_INBOX_URL=http://localhost:3001/remoteEntry.js
# REMOTE_MONITORING_URL=http://localhost:3002/remoteEntry.js
```

### Production (.env.production)

```bash
# Port for production server (if needed)
PORT=3000

# Feature Module Flags
ENABLE_K11_INBOX=true
ENABLE_K11_MONITORING=true

# Module Federation Remote URLs (OPTIONAL - Build-Time Remotes)
# NOTE: For Docker/CDN architecture, these are NOT needed!
# URLs come from your Java backend API (/api/plugins) at runtime.
# Leave empty to use runtime remotes from backend API.

# REMOTE_INBOX_URL=
# REMOTE_MONITORING_URL=

# Examples (only if using build-time remotes):
# REMOTE_INBOX_URL=https://customer-a.example.com/inbox/remoteEntry.js
# REMOTE_MONITORING_URL=https://customer-a.example.com/monitoring/remoteEntry.js
```

## Quick Reference: When Are Remote URLs Needed?

| Scenario | REMOTE_INBOX_URL Needed? | REMOTE_MONITORING_URL Needed? |
|----------|-------------------------|------------------------------|
| **Docker/CDN (Runtime Remotes)** | ❌ **NO** | ❌ **NO** |
| Build-Time Remotes | ✅ YES | ✅ YES |
| Local Bundling | ❌ NO | ❌ NO |

## Docker/CDN Architecture (Recommended)

For your Docker/CDN architecture with runtime remotes:

1. ✅ **Leave `REMOTE_INBOX_URL` and `REMOTE_MONITORING_URL` empty/unset**
2. ✅ Backend API (`/api/plugins`) returns module URLs at runtime
3. ✅ `ModuleFederationLoader` loads remotes dynamically
4. ✅ No build-time configuration needed

**Example backend response:**
```json
[
  {
    "id": "k11-inbox",
    "entryUrl": "https://customer-a.example.com/inbox/remoteEntry.js",
    "remoteName": "k11Inbox",
    "modulePath": "./InboxApp",
    "framework": "react",
    "enabled": true
  }
]
```

## Creating .env Files

1. **Development**: Create `apps/shell/.env` with the development template above
2. **Production**: Create `apps/shell/.env.production` with the production template above
3. **Git**: These files are gitignored (see `.gitignore`), so they won't be committed

## Override at Runtime

You can override any variable at runtime:

```bash
# Override port
PORT=4000 pnpm dev:shell

# Disable a module
ENABLE_K11_MONITORING=false pnpm build --filter shell
```

