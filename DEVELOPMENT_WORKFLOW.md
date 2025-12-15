# Development Workflow Guide

## Quick Answer

**It depends on which development approach you want to use!** You have **3 options**:

1. ✅ **Local Bundling** (Simplest) - No separate servers needed
2. 🔄 **Separate Dev Servers** (Test Module Federation) - Run each module separately
3. 📦 **Build Once, Serve from Shell** (Hybrid) - Build remotes once, serve from shell

---

## Option 1: Local Bundling (Simplest) ✅ **Recommended for Development**

**No separate servers needed!** Modules are bundled directly into the shell app.

### Setup:
```bash
# 1. Make sure .env has remote URLs empty (or unset)
# REMOTE_INBOX_URL=
# REMOTE_MONITORING_URL=

# 2. Start shell dev server (that's it!)
cd apps/shell
pnpm dev
```

### How it works:
- Modules are imported directly from `packages/k11-inbox/src` and `packages/k11-monitoring/src`
- Everything bundled together
- Fast HMR (Hot Module Replacement)
- No Module Federation complexity

### When to use:
- ✅ General development
- ✅ When you don't need to test Module Federation
- ✅ Fastest development experience

---

## Option 2: Separate Dev Servers (Test Module Federation) 🔄

**Run separate dev servers** for each module to test Module Federation in development.

### Setup:
```bash
# Terminal 1: Start inbox remote dev server (port 3001)
cd packages/k11-inbox
pnpm dev:remote
# Server will be available at: http://localhost:3001/remoteEntry.js

# Terminal 2: Start monitoring remote dev server (port 3002)
cd packages/k11-monitoring
pnpm dev:remote
# Server will be available at: http://localhost:3002/remoteEntry.js

# Terminal 3: Start shell app (port 3000)
cd apps/shell
# Update .env to point to dev servers:
# REMOTE_INBOX_URL=http://localhost:3001/remoteEntry.js
# REMOTE_MONITORING_URL=http://localhost:3002/remoteEntry.js
pnpm dev
```

**Note:** The remote dev servers are configured with:
- Port 3001 for k11-inbox
- Port 3002 for k11-monitoring
- CORS headers enabled for cross-origin requests
- Hot Module Replacement (HMR) enabled

### How it works:
- Each module runs its own dev server
- Shell app loads remotes from those servers
- Tests Module Federation setup
- Each module has its own HMR

### When to use:
- ✅ Testing Module Federation configuration
- ✅ Testing remote loading behavior
- ✅ Debugging Module Federation issues
- ✅ Simulating production Docker/CDN setup

### Using turbo (run all at once):
```bash
# From root directory
pnpm turbo run dev:remote --filter=k11-inbox --filter=k11-monitoring &
pnpm dev:shell
```

---

## Option 3: Build Once, Serve from Shell (Hybrid) 📦

**Build remotes once**, then serve them from the shell dev server.

### Setup:
```bash
# 1. Build remotes once (generates remoteEntry.js files)
pnpm turbo run build:remote --filter=k11-inbox --filter=k11-monitoring

# 2. Update .env to use local paths:
# REMOTE_INBOX_URL=/inbox/remoteEntry.js
# REMOTE_MONITORING_URL=/monitoring/remoteEntry.js

# 3. Start shell dev server
cd apps/shell
pnpm dev
```

### How it works:
- Remotes are built to `packages/*/dist/remoteEntry.js`
- Shell dev server serves them from `/inbox/remoteEntry.js` and `/monitoring/remoteEntry.js`
- Uses Module Federation but no separate servers
- Need to rebuild remotes when they change

### When to use:
- ✅ Testing Module Federation without separate servers
- ✅ When you don't need live updates to remotes
- ✅ Simpler than Option 2 but still tests Module Federation

### Auto-rebuild on changes:
```bash
# Watch mode - rebuilds remotes when they change
pnpm turbo run build:remote --filter=k11-inbox --filter=k11-monitoring --watch &
pnpm dev:shell
```

---

## Option 4: Runtime Remotes (Docker/CDN Architecture) 🌐

**For production-like testing** - Backend API provides remote URLs.

### Setup:
```bash
# 1. Make sure backend API is running and returns module configs
# Backend should return:
# GET /api/plugins
# [
#   {
#     "id": "k11-inbox",
#     "entryUrl": "http://localhost:3001/remoteEntry.js",
#     "remoteName": "k11Inbox",
#     "modulePath": "./InboxApp",
#     "framework": "react",
#     "enabled": true
#   }
# ]

# 2. Start remote dev servers (if needed)
cd packages/k11-inbox && pnpm dev:remote &
cd packages/k11-monitoring && pnpm dev:remote &

# 3. Start shell app (no env vars needed!)
cd apps/shell
# REMOTE_INBOX_URL and REMOTE_MONITORING_URL should be empty/unset
pnpm dev
```

### How it works:
- Shell app fetches module configs from `/api/plugins`
- `ModuleFederationLoader` loads remotes dynamically
- Matches production Docker/CDN architecture
- No build-time configuration needed

### When to use:
- ✅ Testing production Docker/CDN architecture
- ✅ Testing customer-specific module loading
- ✅ Integration testing with backend API

---

## Comparison Table

| Option | Separate Servers? | Module Federation? | HMR for Remotes? | Complexity |
|--------|------------------|-------------------|------------------|------------|
| **1. Local Bundling** | ❌ No | ❌ No | ✅ Yes | ⭐ Simple |
| **2. Separate Dev Servers** | ✅ Yes (3 servers) | ✅ Yes | ✅ Yes | ⭐⭐⭐ Complex |
| **3. Build Once, Serve** | ❌ No | ✅ Yes | ❌ No (rebuild needed) | ⭐⭐ Medium |
| **4. Runtime Remotes** | ✅ Yes (optional) | ✅ Yes | ✅ Yes (if servers running) | ⭐⭐⭐ Complex |

---

## Recommended Development Workflow

### For General Development:
```bash
# Option 1: Local Bundling (simplest)
cd apps/shell
pnpm dev
```

### For Testing Module Federation:
```bash
# Option 2: Separate Dev Servers
# Terminal 1
cd packages/k11-inbox && pnpm dev:remote

# Terminal 2  
cd packages/k11-monitoring && pnpm dev:remote

# Terminal 3
cd apps/shell
# Set in .env: REMOTE_INBOX_URL=http://localhost:3001/remoteEntry.js
# Set in .env: REMOTE_MONITORING_URL=http://localhost:3002/remoteEntry.js
pnpm dev
```

### For Production-Like Testing:
```bash
# Option 4: Runtime Remotes
# 1. Start backend API (returns module configs)
# 2. Start remote dev servers (optional, if testing with live remotes)
# 3. Start shell app
cd apps/shell
pnpm dev
```

---

## Environment Variables by Option

### Option 1: Local Bundling
```bash
# .env
REMOTE_INBOX_URL=
REMOTE_MONITORING_URL=
```

### Option 2: Separate Dev Servers
```bash
# .env
REMOTE_INBOX_URL=http://localhost:3001/remoteEntry.js
REMOTE_MONITORING_URL=http://localhost:3002/remoteEntry.js
```

### Option 3: Build Once, Serve
```bash
# .env
REMOTE_INBOX_URL=/inbox/remoteEntry.js
REMOTE_MONITORING_URL=/monitoring/remoteEntry.js
```

### Option 4: Runtime Remotes
```bash
# .env
REMOTE_INBOX_URL=
REMOTE_MONITORING_URL=
# URLs come from backend API
```

---

## Troubleshooting

### "Module not found" errors:
- Check that `ENABLE_K11_INBOX=true` and `ENABLE_K11_MONITORING=true` in `.env`
- For Option 2/4: Make sure remote dev servers are running
- For Option 3: Make sure remotes are built (`pnpm build:remote`)

### "Shared module not available" errors:
- This is normal for Option 1 (local bundling) - modules are bundled directly
- For Module Federation options: Check that shared dependencies have `eager: true` in webpack config

### Remote not loading:
- Check that `remoteEntry.js` is accessible at the configured URL
- For Option 2: Verify dev servers are running on correct ports (3001, 3002)
- For Option 4: Check backend API returns correct module configs
- Verify CORS headers are set (already configured in webpack configs)

### Port already in use:
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill <PID>

# Or use a different port
PORT=3003 pnpm dev:remote
```

---

## Summary

**For most development:** Use **Option 1 (Local Bundling)** - simplest and fastest.

**For testing Module Federation:** Use **Option 2 (Separate Dev Servers)** - most realistic.

**For production-like testing:** Use **Option 4 (Runtime Remotes)** - matches your Docker/CDN architecture.

You don't need to start separate servers for general development! 🎉

