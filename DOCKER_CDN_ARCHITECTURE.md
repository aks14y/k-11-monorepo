# Docker/CDN Architecture for Module Federation

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
│ k11-inbox    │  │ k11-monitoring│  │ Other Modules│
│ Docker       │  │ Docker        │  │ Docker       │
│ Container    │  │ Container     │  │ Containers   │
│              │  │              │  │              │
│ Serves:      │  │ Serves:      │  │ Serves:      │
│ remoteEntry.js│ │ remoteEntry.js│ │ remoteEntry.js│
└──────────────┘  └──────────────┘  └──────────────┘
```

## Key Differences from Angular Setup

### Angular (Previous)
- **Configuration**: `setup.xml` from SQL database
- **Loading**: SystemJS or iframe-based loading
- **Deployment**: Separate Docker containers per module

### React (Current)
- **Configuration**: JSON API endpoint (`/api/plugins`) from SQL database
- **Loading**: Module Federation with runtime dynamic remotes
- **Deployment**: Separate Docker containers per module ✅ **Same approach!**

## Why Separate Docker Containers/CDN?

✅ **Correct Approach** - This matches your Angular architecture and provides:

1. **Customer-Specific Module Selection**
   - Only required modules are deployed per customer
   - Configuration stored in SQL (via Java backend API)
   - Modules loaded dynamically based on customer config

2. **Independent Deployment**
   - Each module can be deployed independently
   - No need to rebuild shell when a module updates
   - Faster deployment cycles

3. **Scalability**
   - Scale modules independently based on load
   - Different modules can be on different servers/CDNs

4. **Version Management**
   - Each module can have its own version
   - A/B testing per module
   - Gradual rollouts

## Backend API Contract

Your Java backend should expose an endpoint that returns module configuration:

### Endpoint: `GET /api/plugins`

**Response Format:**
```json
[
  {
    "id": "k11-inbox",
    "name": "k11Inbox",
    "route": "/inbox",
    "framework": "react",
    "entryUrl": "https://customer-a.example.com/inbox/remoteEntry.js",
    "remoteName": "k11Inbox",
    "modulePath": "./InboxApp",
    "enabled": true,
    "metadata": {
      "title": "Inbox",
      "icon": "inbox-icon",
      "description": "Notification inbox"
    }
  },
  {
    "id": "k11-monitoring",
    "name": "k11Monitoring",
    "route": "/monitoring",
    "framework": "react",
    "entryUrl": "https://customer-a.example.com/monitoring/remoteEntry.js",
    "remoteName": "k11Monitoring",
    "modulePath": "./MonitoringApp",
    "enabled": true,
    "metadata": {
      "title": "Monitoring",
      "icon": "monitoring-icon",
      "description": "System monitoring dashboard"
    }
  }
]
```

### Field Descriptions

- **`entryUrl`**: Full URL to the `remoteEntry.js` file (served from Docker container or CDN)
- **`remoteName`**: Module Federation remote name (must match the remote's webpack config)
- **`modulePath`**: Path to the exposed module (e.g., `"./InboxApp"`)
- **`enabled`**: Whether this module should be loaded for this customer

## Docker Deployment Strategy

### 1. Build Each Module Separately

```bash
# Build k11-inbox remote
cd packages/k11-inbox
pnpm build:remote
# Output: dist/remoteEntry.js

# Build k11-monitoring remote
cd packages/k11-monitoring
pnpm build:remote
# Output: dist/remoteEntry.js
```

### 2. Create Dockerfile for Each Module

**Example: `packages/k11-inbox/Dockerfile`**
```dockerfile
FROM nginx:alpine

# Copy built remoteEntry.js and chunks
COPY dist/ /usr/share/nginx/html/

# Configure CORS for Module Federation
RUN echo 'add_header Access-Control-Allow-Origin *;' > /etc/nginx/conf.d/cors.conf

EXPOSE 80
```

### 3. Deploy to Docker Hub / Container Registry

```bash
# Build and push k11-inbox
docker build -t your-registry/k11-inbox:1.0.0 packages/k11-inbox
docker push your-registry/k11-inbox:1.0.0

# Build and push k11-monitoring
docker build -t your-registry/k11-monitoring:1.0.0 packages/k11-monitoring
docker push your-registry/k11-monitoring:1.0.0
```

### 4. Deploy Shell App

**`apps/shell/Dockerfile`**
```dockerfile
FROM nginx:alpine

# Copy built shell app
COPY dist/ /usr/share/nginx/html/

# Configure SPA routing
RUN echo 'try_files $uri $uri/ /index.html;' > /etc/nginx/conf.d/spa.conf

EXPOSE 80
```

### 5. Runtime Configuration (via Java Backend)

When a customer's environment starts:
1. Java backend reads customer config from SQL
2. Backend API (`/api/plugins`) returns module URLs
3. Shell app fetches config and loads remotes dynamically
4. Only enabled modules are loaded

## CDN Alternative

Instead of separate Docker containers, you can use a CDN:

### Benefits:
- Faster global delivery
- Automatic caching
- Lower infrastructure costs

### Setup:
1. Upload `remoteEntry.js` files to CDN (e.g., AWS CloudFront, Azure CDN)
2. Backend API returns CDN URLs:
   ```json
   {
     "entryUrl": "https://cdn.example.com/k11-inbox/v1.0.0/remoteEntry.js"
   }
   ```

## Module Federation Configuration

### Shell App (Host)
- **Shared dependencies**: `eager: true` (required for remotes to consume)
- **Remotes**: Can be empty (loaded at runtime) or configured for development

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

## Comparison: Local Bundling vs Separate Servers

| Aspect | Local Bundling | Separate Docker/CDN |
|--------|---------------|---------------------|
| **Customer-specific modules** | ❌ All modules bundled | ✅ Only enabled modules loaded |
| **Independent deployment** | ❌ Rebuild shell for changes | ✅ Deploy modules independently |
| **Bundle size** | ❌ Larger (all modules) | ✅ Smaller (only needed modules) |
| **Scalability** | ❌ Single server | ✅ Scale modules independently |
| **Your use case** | ❌ Doesn't match Angular setup | ✅ **Matches your architecture** |

## Recommendation

✅ **Use Separate Docker Containers/CDN** - This is the right approach for your architecture because:

1. It matches your existing Angular setup pattern
2. Enables customer-specific module selection
3. Supports independent deployments
4. Works with your SQL-based configuration system
5. Provides better scalability and performance

## Next Steps

1. ✅ Runtime Module Federation loader is implemented
2. ✅ Plugin type supports Module Federation config
3. ✅ ReactLoader uses runtime remotes
4. ⏭️ Update Java backend to return Module Federation config
5. ⏭️ Create Dockerfiles for each module
6. ⏭️ Set up Docker Hub/registry
7. ⏭️ Configure deployment pipeline

## Example: Customer A vs Customer B

**Customer A** (has inbox and monitoring):
```json
[
  {
    "id": "k11-inbox",
    "entryUrl": "https://customer-a.example.com/inbox/remoteEntry.js",
    "enabled": true
  },
  {
    "id": "k11-monitoring",
    "entryUrl": "https://customer-a.example.com/monitoring/remoteEntry.js",
    "enabled": true
  }
]
```

**Customer B** (inbox only):
```json
[
  {
    "id": "k11-inbox",
    "entryUrl": "https://customer-b.example.com/inbox/remoteEntry.js",
    "enabled": true
  },
  {
    "id": "k11-monitoring",
    "enabled": false  // Not loaded for this customer
  }
]
```

The shell app automatically loads only the enabled modules for each customer! 🎉

