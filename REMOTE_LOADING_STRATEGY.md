# Remote Loading Strategy

## Answer: Do you need `REMOTE_INBOX_URL` and `REMOTE_MONITORING_URL` env vars?

**For Docker/CDN Architecture (Runtime Remotes): NO ❌**

The URLs come from your Java backend API (`/api/plugins`), not from environment variables.

## Three Loading Strategies

### 1. Runtime Remotes (Docker/CDN) ✅ **Recommended for Production**

**How it works:**
- Shell app fetches module config from `/api/plugins` at runtime
- Backend returns URLs like: `"entryUrl": "https://customer-a.example.com/inbox/remoteEntry.js"`
- `ModuleFederationLoader` loads remotes dynamically
- No build-time configuration needed

**Env vars needed:** ❌ None
- `REMOTE_INBOX_URL` - NOT needed
- `REMOTE_MONITORING_URL` - NOT needed

**When to use:**
- ✅ Production Docker/CDN deployments
- ✅ Customer-specific module selection
- ✅ Matches your Angular setup pattern

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

---

### 2. Build-Time Remotes (Static Configuration)

**How it works:**
- Remotes configured in `webpack.config.js` at build time
- URLs must be known before building
- Webpack bundles remote references into the shell

**Env vars needed:** ✅ YES
- `REMOTE_INBOX_URL` - Required (e.g., `"https://cdn.example.com/inbox/remoteEntry.js"`)
- `REMOTE_MONITORING_URL` - Required (e.g., `"https://cdn.example.com/monitoring/remoteEntry.js"`)

**When to use:**
- Development with known remote URLs
- Static deployments with fixed module locations
- Testing Module Federation setup

**Example `.env`:**
```bash
REMOTE_INBOX_URL=https://localhost:3001/remoteEntry.js
REMOTE_MONITORING_URL=https://localhost:3002/remoteEntry.js
```

---

### 3. Local Bundling (No Remotes)

**How it works:**
- Modules bundled directly into shell app
- No Module Federation remotes
- Everything in one bundle

**Env vars needed:** ❌ None
- `REMOTE_INBOX_URL` - NOT needed (leave empty or unset)
- `REMOTE_MONITORING_URL` - NOT needed (leave empty or unset)

**When to use:**
- Development without separate module servers
- Single-bundle deployments
- Testing without Module Federation

---

## Current Implementation

Your `App.tsx` now uses **Strategy 1 (Runtime Remotes)**:

1. ✅ Fetches plugins from `/api/plugins` via `PluginRegistry`
2. ✅ Loads modules dynamically via `DynamicRoute` → `ModuleFederationLoader`
3. ✅ Falls back to local imports if modules are bundled locally
4. ❌ No longer uses build-time remotes (`InboxAppRemote`, `MonitoringAppRemote`)

**Result:** You don't need `REMOTE_INBOX_URL` or `REMOTE_MONITORING_URL` env vars! 🎉

---

## Migration Path

If you want to keep build-time remotes as a fallback for development:

1. Keep the env vars in `.env` for development
2. Use them in `webpack.config.js` (already configured)
3. But for production Docker/CDN, rely on runtime remotes from backend API

**Recommended:** Use runtime remotes everywhere for consistency with your Docker/CDN architecture.

---

## Summary

| Strategy | Env Vars Needed? | Use Case |
|----------|------------------|----------|
| **Runtime Remotes** (Docker/CDN) | ❌ **NO** | Production, customer-specific |
| Build-Time Remotes | ✅ **YES** | Development, static configs |
| Local Bundling | ❌ **NO** | Development, single bundle |

**Your answer:** For Docker/CDN architecture, **NO env vars needed** - URLs come from backend API! ✅

