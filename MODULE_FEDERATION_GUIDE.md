# Module Federation: Dependencies vs Shared Modules Guide

## Understanding the Two Mechanisms

### 1. **package.json Dependencies**
**Purpose:** Build-time and development dependencies

**Used for:**
- TypeScript compilation (type checking)
- Webpack module resolution during build
- Development server (local dev)
- IDE autocomplete and type hints

**When they're used:**
- ✅ **Build time**: Webpack needs these to bundle your code
- ✅ **Development**: Local dev server needs these installed
- ❌ **Runtime (for remotes)**: If marked as `shared` with `eager: false`, webpack won't bundle them

### 2. **ModuleFederationPlugin.shared**
**Purpose:** Runtime dependency sharing between host and remotes

**Used for:**
- Preventing duplicate loading of the same module
- Version negotiation between host and remotes
- Runtime module resolution

**When they're used:**
- ✅ **Runtime**: When the remote module is loaded by the host
- ✅ **Version checking**: Ensures compatible versions between host and remote

## How They Work Together

### For Remote Modules (@k11-inbox, @k11-monitoring):

```javascript
// package.json
{
  "peerDependencies": {
    "react": "^18.2.0",  // ← Needed for TypeScript and build
    "@mantine/core": "^8.3.10"
  },
  "devDependencies": {
    "@mantine/core": "^8.3.10"  // ← Needed for local dev server
  }
}

// webpack.config.js
shared: {
  react: {
    singleton: true,
    requiredVersion: "^18.2.0",
    eager: false  // ← "Don't bundle this, consume from host at runtime"
  }
}
```

**What happens:**
1. **Build time**: Webpack uses `package.json` dependencies to resolve imports and type-check
2. **Bundle time**: Webpack sees `eager: false` and **doesn't bundle** React into the remote
3. **Runtime**: When host loads the remote, Module Federation provides React from the host

### For Host (Shell):

```javascript
// package.json
{
  "dependencies": {
    "react": "^18.2.0"  // ← Actually installed and bundled
  }
}

// webpack.config.js
shared: {
  react: {
    singleton: true,
    requiredVersion: "^18.2.0",
    eager: true  // ← "Bundle this and provide it to remotes"
  }
}
```

**What happens:**
1. **Build time**: Webpack bundles React into the host bundle
2. **Runtime**: Host provides React to all remotes that request it

## Your Docker Setup

### Development (Separate Ports: 3000, 3001, 3002)

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Shell (3000)   │         │  Inbox (3001)   │         │ Monitoring(3002)│
│                 │         │                 │         │                 │
│  node_modules/  │         │  node_modules/  │         │  node_modules/  │
│  - react ✅      │         │  - react ✅     │         │  - react ✅     │
│  - mantine ✅    │         │  - mantine ✅   │         │  - mantine ✅   │
│                 │         │                 │         │                 │
│  Provides:      │◄────────┤  Consumes:      │         │  Consumes:      │
│  - react        │         │  - react        │         │  - react        │
│  - mantine      │         │  - mantine      │         │  - mantine      │
│  (eager: true)  │         │  (eager: false) │         │  (eager: false) │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

**What happens:**
1. Each container has its own `node_modules` (for build/dev)
2. Shell bundles React/Mantine with `eager: true`
3. Inbox/Monitoring build without React/Mantine (due to `eager: false`)
4. At runtime, when Shell loads Inbox:
   - Shell's React is already loaded
   - Inbox requests React → Module Federation provides Shell's React
   - No duplicate loading!

### Production (Separate Server Paths)

```
┌─────────────────────────┐
│  Production Server      │
│                         │
│  /shell/                │  ← Shell app (provides shared modules)
│  /inbox/                │  ← Inbox remote (consumes from shell)
│  /monitoring/           │  ← Monitoring remote (consumes from shell)
│                         │
│  All served from same   │
│  origin, different paths│
└─────────────────────────┘
```

**What happens:**
1. Each app is built in its own Docker container
2. All apps are deployed to the same server (different paths)
3. Module Federation works the same way:
   - Shell provides shared modules
   - Remotes consume from shell
   - Same origin = no CORS issues

## Best Practices for Your Setup

### 1. **package.json Structure**

**For Remotes (@k11-inbox, @k11-monitoring):**
```json
{
  "peerDependencies": {
    "react": "^18.2.0",           // Version constraint
    "@mantine/core": "^8.3.10"    // Must match host version
  },
  "devDependencies": {
    "react": "^18.2.0",           // For local dev server
    "@mantine/core": "^8.3.10",   // For local dev server
    // ... build tools
  }
}
```

**Why:**
- `peerDependencies`: Documents what the host must provide
- `devDependencies`: Needed for local development and build

### 2. **ModuleFederationPlugin.shared Configuration**

**For Remotes:**
```javascript
shared: {
  react: {
    singleton: true,              // Only one instance
    requiredVersion: "^18.2.0",   // Version constraint
    eager: false                  // Consume from host
  }
}
```

**For Host:**
```javascript
shared: {
  react: {
    singleton: true,
    requiredVersion: "^18.2.0",
    eager: true                   // Provide to remotes
  }
}
```

### 3. **Version Compatibility**

**Critical:** Host and remotes must have compatible versions!

```javascript
// Shell package.json
"react": "^18.2.0"

// Inbox package.json (peerDependencies)
"react": "^18.2.0"  // ✅ Compatible

// Inbox webpack.config.js
requiredVersion: "^18.2.0"  // ✅ Matches
```

**If versions don't match:**
- Module Federation will load both versions
- Duplicate React = errors and bugs
- Bundle size increases

### 4. **Docker Container Strategy**

**Option A: Separate Containers (Recommended for Production)**
```
Container 1: Shell
  - Builds with all dependencies
  - Provides shared modules
  - Serves at /shell/

Container 2: Inbox
  - Builds with devDependencies only
  - Doesn't bundle shared modules
  - Serves at /inbox/

Container 3: Monitoring
  - Builds with devDependencies only
  - Doesn't bundle shared modules
  - Serves at /monitoring/
```

**Benefits:**
- Independent deployments
- Smaller remote bundles
- Clear separation of concerns

**Option B: Monorepo Build (Current Setup)**
```
Single Container:
  - Builds all packages together
  - Uses workspace: protocol
  - All apps in same container
```

**Benefits:**
- Simpler for development
- Shared node_modules
- Faster builds (TurboRepo caching)

## Common Issues and Solutions

### Issue 1: "Module not found" during build
**Cause:** Missing dependency in `package.json`
**Solution:** Add to `devDependencies` (for remotes) or `dependencies` (for host)

### Issue 2: "Shared module version mismatch"
**Cause:** Host and remote have different versions
**Solution:** Ensure `requiredVersion` matches in both configs

### Issue 3: "Duplicate React" errors
**Cause:** Remote is bundling React despite `eager: false`
**Solution:** Check that `eager: false` is set correctly in remote config

### Issue 4: CORS errors in production
**Cause:** Remotes served from different origins
**Solution:** Ensure all apps served from same origin (different paths, not different domains)

## Recommendations for Your Setup

1. **Keep dependencies in package.json** - Needed for build and dev
2. **Use peerDependencies** - Documents what host must provide
3. **Use devDependencies** - For build tools and local dev
4. **Match versions** - Ensure host and remotes use compatible versions
5. **Test locally** - Use separate ports to simulate production
6. **Deploy together** - Ensure all apps use same shared module versions

## Summary

- **package.json dependencies**: Build-time, needed for compilation and bundling
- **ModuleFederationPlugin.shared**: Runtime, controls what gets shared between host and remotes
- **Both are needed**: Dependencies for build, shared config for runtime behavior
- **Your Docker setup works**: Separate containers can share modules at runtime via Module Federation


