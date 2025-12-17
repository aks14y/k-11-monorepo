# Docker Architecture for Module Federation

This document explains how to deploy the React monorepo with Module Federation using separate Docker containers for each feature module, similar to your Angular setup with `setup.xml`.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Java Backend API                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/plugins endpoint                               │  │
│  │  Returns customer-specific module configuration      │  │
│  │  (equivalent to setup.xml from SQL)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP API
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Shell App (Host)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Docker Container: shell-app                           │  │
│  │  - Fetches plugin config from /api/plugins            │  │
│  │  - Loads remotes dynamically at runtime                │  │
│  │  - Serves shared dependencies (React, React-DOM)      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ k11-inbox    │  │ k11-monitoring│  │ External     │
│ Docker       │  │ Docker       │  │ Module       │
│ Container    │  │ Container    │  │ Container    │
│              │  │              │  │              │
│ remoteEntry.js│ │ remoteEntry.js│ │ remoteEntry.js│
└──────────────┘  └──────────────┘  └──────────────┘
```

## How It Works

1. **Backend API** (`/api/plugins`) returns customer-specific module configuration
2. **Shell App** fetches plugin config at runtime
3. **ModuleFederationLoader** dynamically loads `remoteEntry.js` from Docker containers
4. **Modules** are loaded and rendered in the shell app

## Module Configuration

Each module is configured via the backend API response:

```json
[
  {
    "id": "k11-inbox",
    "name": "Inbox",
    "route": "/inbox",
    "framework": "react",
    "entryUrl": "https://customer-a.example.com/inbox/remoteEntry.js",
    "remoteName": "k11Inbox",
    "modulePath": "./InboxApp",
    "enabled": true,
    "metadata": {
      "title": "Notification Inbox",
      "icon": "inbox",
      "description": "View and manage notifications."
    }
  }
]
```

## Module Federation Configuration

### Shell App (Host)
- **Shared dependencies**: `eager: true` (required for remotes to consume)
- **Remotes**: Empty `{}` - all remotes loaded dynamically at runtime

### Remote Modules (k11-inbox, k11-monitoring)
- **Shared dependencies**: `eager: false` (consume from host)
- **Exposes**: Module components (e.g., `./InboxApp`)

## Runtime Loading Flow

1. **User visits shell app**
   ```
   Shell app loads → Fetches /api/plugins → Gets module configs
   ```

2. **Shell app loads remotes dynamically**
   ```typescript
   // PluginRegistry fetches from backend
   const plugins = await registry.fetchPlugins();
   
   // For each enabled plugin with framework="react"
   // ModuleFederationLoader loads the remoteEntry.js
   const container = await mfLoader.loadRemote({
     name: "k11Inbox",
     url: "https://customer-a.example.com/inbox/remoteEntry.js"
   });
   
   // Then loads the specific module
   const Module = await container.get("./InboxApp");
   ```

3. **Module renders in shell**
   - Shared dependencies (React, React-DOM) come from shell
   - Module code comes from remote container
   - Single React instance across all modules

## Comparison: Local Bundling vs Separate Docker Containers

| Aspect | Local Bundling | Separate Docker Containers |
|--------|---------------|---------------------------|
| **Customer-specific modules** | ❌ All modules bundled | ✅ Only enabled modules loaded |
| **Independent deployment** | ❌ Rebuild shell for changes | ✅ Deploy modules independently |
| **Bundle size** | ❌ Larger (all modules) | ✅ Smaller (only needed modules) |
| **Scalability** | ❌ Single server | ✅ Scale modules independently |
| **Your use case** | ❌ Doesn't match Angular setup | ✅ **Matches your architecture** |

## Recommendation

✅ **Use Separate Docker Containers** - This is the right approach for your architecture because:

1. It matches your existing Angular setup pattern
2. Enables customer-specific module selection
3. Allows independent deployment of modules
4. Scales better for production
