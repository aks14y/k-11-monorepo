# Remote Error Handling - Option 2 Setup

## What Changed

The shell app now properly handles errors when remote URLs are set but remote servers are not running.

## Behavior

### When Remote URLs ARE Set (Option 2: Separate Dev Servers)

```bash
# .env
REMOTE_INBOX_URL=http://localhost:3001/remoteEntry.js
REMOTE_MONITORING_URL=http://localhost:3002/remoteEntry.js
```

**Behavior:**
- ✅ **No fallback to local bundling** - Only uses remote modules
- ❌ **Shows error** if remote server is not running
- ✅ **Shows error message** with helpful troubleshooting info

### When Remote URLs are NOT Set

```bash
# .env
# REMOTE_INBOX_URL=
# REMOTE_MONITORING_URL=
```

**Behavior:**
- ✅ **Uses local bundling** - Modules bundled directly into shell
- ✅ **No remote dependency** - Works without separate servers

## Error Display

When a remote server is down, you'll see:

```
Error Loading k11-monitoring

Failed to load remote module k11Monitoring from http://localhost:3002/remoteEntry.js. 
Make sure the remote dev server is running. Original error: [error details]

Remote URL: http://localhost:3002/remoteEntry.js

Make sure the remote dev server is running and accessible.
Check that the remote server is running on the configured port.
```

## Testing Option 2

### Step 1: Set Remote URLs

```bash
# Edit apps/shell/.env
REMOTE_INBOX_URL=http://localhost:3001/remoteEntry.js
REMOTE_MONITORING_URL=http://localhost:3002/remoteEntry.js
```

### Step 2: Start Remote Servers

```bash
# Terminal 1: Inbox remote (port 3001)
cd packages/k11-inbox
pnpm dev:remote

# Terminal 2: Monitoring remote (port 3002)
cd packages/k11-monitoring
pnpm dev:remote
```

### Step 3: Start Shell App

```bash
# Terminal 3: Shell app (port 3000)
cd apps/shell
pnpm dev
```

### Step 4: Test Error Handling

1. **With servers running**: Modules should load correctly
2. **Stop monitoring server**: Navigate to `/monitoring` → Should show error
3. **Stop inbox server**: Navigate to `/inbox` → Should show error

## Code Changes

### 1. Remote vs Local Detection

```typescript
// Check if remote URLs are configured
const USE_REMOTE_INBOX = Boolean(process.env.REMOTE_INBOX_URL);
const USE_REMOTE_MONITORING = Boolean(process.env.REMOTE_MONITORING_URL);
```

### 2. Separate Remote and Local Imports

```typescript
// Remote imports (when URLs are set)
const InboxAppRemote = USE_REMOTE_INBOX ? lazy(() => import("k11Inbox/InboxApp")) : undefined;

// Local imports (when URLs are NOT set)
const InboxAppLocal = !USE_REMOTE_INBOX ? lazy(() => import("k11-inbox")) : undefined;
```

### 3. Route Logic

```typescript
{USE_REMOTE_INBOX && InboxAppRemote ? (
  // Use remote - NO fallback
  <RemoteErrorBoundary>
    <InboxAppRemote />
  </RemoteErrorBoundary>
) : InboxAppLocal ? (
  // Use local - only when remote URL is NOT set
  <InboxAppLocal />
) : null}
```

### 4. Error Boundary

Created `RemoteErrorBoundary` component that:
- Catches errors from lazy-loaded remote modules
- Shows helpful error messages
- Displays remote URL for debugging
- Provides troubleshooting hints

## Priority Order

1. **Runtime remotes** (from PluginRegistry/backend API) - Highest priority
2. **Build-time remotes** (when REMOTE_*_URL env vars set) - No fallback
3. **Local bundling** (when REMOTE_*_URL env vars NOT set) - Fallback only

## Summary

✅ **Remote URLs set** → Use remotes only, show error if down  
✅ **Remote URLs NOT set** → Use local bundling  
✅ **No fallback** when remotes are configured  
✅ **Clear error messages** when remotes fail  

Perfect for testing Option 2 (Separate Dev Servers)! 🎯

