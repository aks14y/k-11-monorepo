# Platform Architecture for External Components

## Problem Statement

The current monorepo uses **build-time bundling** where all modules are compiled together. However, you need a **platform** where:
- External developers can ship components (Angular, React, Vue, etc.)
- Components are loaded **at runtime** (not build-time)
- Route configuration comes from **database/API** (not hardcoded)
- Navbar dynamically renders based on available plugins
- Components can be added/removed without rebuilding the shell

---

## Proposed Architecture

### Hybrid Approach: Internal Modules + External Plugins

```
┌─────────────────────────────────────────────────────────────┐
│                    Platform Shell (React)                    │
│                    (apps/shell)                              │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                         │
        ▼                                         ▼
┌──────────────────┐                  ┌──────────────────┐
│ Internal Modules  │                  │ External Plugins  │
│ (Build-time)      │                  │ (Runtime)         │
│                   │                  │                   │
│ - k11-inbox       │                  │ - Angular Apps    │
│ - k11-monitoring  │                  │ - React Apps      │
│ - design-system   │                  │ - Vue Apps        │
│                   │                  │ - Any Framework   │
└──────────────────┘                  └──────────────────┘
```

---

## Solution Components

### 1. Plugin Registry System

**Purpose**: Store and manage external component metadata

**Structure**:
```typescript
// packages/plugin-registry/src/types.ts
export interface Plugin {
  id: string;
  name: string;
  route: string;
  framework: 'react' | 'angular' | 'vue' | 'html';
  entryUrl: string;        // URL to load the component bundle
  manifestUrl: string;    // URL to component manifest
  version: string;
  enabled: boolean;
  metadata: {
    title: string;
    icon?: string;
    description?: string;
  };
}
```

**API Integration**:
```typescript
// packages/plugin-registry/src/PluginRegistry.ts
export class PluginRegistry {
  async fetchPlugins(): Promise<Plugin[]> {
    // Fetch from your Java backend API
    const response = await fetch('/api/plugins');
    return response.json();
  }
  
  async loadPlugin(plugin: Plugin): Promise<any> {
    // Runtime loading logic based on framework
    switch (plugin.framework) {
      case 'react':
        return this.loadReactPlugin(plugin);
      case 'angular':
        return this.loadAngularPlugin(plugin);
      case 'html':
        return this.loadHtmlPlugin(plugin);
      default:
        throw new Error(`Unsupported framework: ${plugin.framework}`);
    }
  }
}
```

---

### 2. Runtime Module Loader

**For React Components** (Module Federation):
```javascript
// apps/shell/webpack.config.js - Add ModuleFederationPlugin
const ModuleFederationPlugin = require('@module-federation/webpack');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        // Dynamic remotes loaded at runtime
        // 'external-plugin': 'external_plugin@http://cdn.example.com/remoteEntry.js'
      },
    }),
  ],
};
```

**For Angular/Other Frameworks** (SystemJS or iframe):
```typescript
// packages/plugin-loader/src/loaders/AngularLoader.ts
export class AngularLoader {
  async load(plugin: Plugin): Promise<void> {
    // Option 1: SystemJS (if Angular is built as UMD)
    await System.import(plugin.entryUrl);
    
    // Option 2: iframe (isolated execution)
    return this.loadInIframe(plugin);
  }
  
  private loadInIframe(plugin: Plugin): Promise<void> {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.src = plugin.entryUrl;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      
      iframe.onload = () => resolve();
      document.getElementById('plugin-container')?.appendChild(iframe);
    });
  }
}
```

**For HTML/Static Components**:
```typescript
// packages/plugin-loader/src/loaders/HtmlLoader.ts
export class HtmlLoader {
  async load(plugin: Plugin): Promise<void> {
    const response = await fetch(plugin.entryUrl);
    const html = await response.text();
    
    // Render HTML in a sandboxed container
    const container = document.getElementById('plugin-container');
    if (container) {
      container.innerHTML = html;
    }
  }
}
```

---

### 3. Dynamic Route Configuration

**Replace hardcoded routes with API-driven routes**:

```typescript
// apps/shell/src/App.tsx - Updated
import { useEffect, useState } from 'react';
import { PluginRegistry } from '@plugin-registry';
import { DynamicRoute } from './components/DynamicRoute';

export const App = () => {
  const { isAuthenticated, user } = useAuth();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [routes, setRoutes] = useState<RouteConfig[]>([]);

  useEffect(() => {
    const registry = new PluginRegistry();
    
    // Fetch plugins from your Java backend
    registry.fetchPlugins().then((fetchedPlugins) => {
      setPlugins(fetchedPlugins);
      
      // Generate routes dynamically
      const dynamicRoutes = fetchedPlugins
        .filter(p => p.enabled)
        .map(plugin => ({
          path: plugin.route,
          element: <DynamicRoute plugin={plugin} />
        }));
      
      setRoutes(dynamicRoutes);
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={...} />
        <Route
          path="/*"
          element={
            <Layout plugins={plugins}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                {/* Internal modules (existing) */}
                {ENABLE_K11_INBOX && InboxApp && (
                  <Route path="/inbox" element={...} />
                )}
                {/* Dynamic external plugins */}
                {routes.map(route => (
                  <Route key={route.path} {...route} />
                ))}
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
```

---

### 4. Dynamic Navbar

**Update Layout to fetch navigation from API**:

```typescript
// apps/shell/src/components/Layout.tsx - Updated
export const Layout = ({ children, plugins }: LayoutProps) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Build navigation from plugins + internal modules
  const navItems = [
    { path: '/', label: 'Dashboard' },
    ...(ENABLE_K11_INBOX ? [{ path: '/inbox', label: 'Inbox' }] : []),
    ...(ENABLE_K11_MONITORING ? [{ path: '/monitoring', label: 'Monitoring' }] : []),
    ...plugins
      .filter(p => p.enabled)
      .map(p => ({
        path: p.route,
        label: p.metadata.title,
        icon: p.metadata.icon
      }))
  ];

  return (
    <Container>
      <Header>
        <strong>Shell Host</strong>
        <NavLinks>
          {navItems.map(item => (
            <Link key={item.path} to={item.path}>
              {item.icon && <img src={item.icon} alt="" />}
              {item.label}
            </Link>
          ))}
        </NavLinks>
        {/* ... */}
      </Header>
      <Main>{children}</Main>
    </Container>
  );
};
```

---

### 5. Plugin Container Component

**Component that loads and renders external plugins**:

```typescript
// apps/shell/src/components/DynamicRoute.tsx
import { Suspense, useEffect, useState } from 'react';
import { PluginLoader } from '@plugin-loader';
import { Plugin } from '@plugin-registry';
import { Card, Stack, Heading, Text } from '@design-system';

type DynamicRouteProps = {
  plugin: Plugin;
};

export const DynamicRoute = ({ plugin }: DynamicRouteProps) => {
  const [Component, setComponent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loader = new PluginLoader();
    
    loader
      .load(plugin)
      .then((component) => {
        setComponent(() => component);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [plugin]);

  if (loading) {
    return (
      <Card>
        <Stack gap="16px">
          <Heading level={2}>Loading {plugin.metadata.title}…</Heading>
          <Text variant="muted">Preparing the component.</Text>
        </Stack>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Stack gap="16px">
          <Heading level={2}>Error Loading Component</Heading>
          <Text variant="muted">{error}</Text>
        </Stack>
      </Card>
    );
  }

  // Render based on framework
  if (plugin.framework === 'html') {
    return <div id="plugin-container" />;
  }

  if (plugin.framework === 'angular') {
    return <div id="plugin-container" />; // iframe or SystemJS
  }

  // React component
  return Component ? <Component /> : null;
};
```

---

## Implementation Steps

### Phase 1: Plugin Registry Package
1. Create `packages/plugin-registry/` with TypeScript types
2. Implement `PluginRegistry` class with API integration
3. Add API client to fetch plugins from Java backend

### Phase 2: Plugin Loader Package
1. Create `packages/plugin-loader/` with framework-specific loaders
2. Implement React loader (Module Federation)
3. Implement Angular loader (SystemJS or iframe)
4. Implement HTML loader (direct rendering)

### Phase 3: Update Shell App
1. Install Module Federation plugin for webpack
2. Update `App.tsx` to fetch routes from API
3. Update `Layout.tsx` to build navbar from plugins
4. Create `DynamicRoute` component

### Phase 4: Backend Integration
1. Create API endpoint: `GET /api/plugins` (in your Java backend)
2. Store plugin metadata in database
3. Return plugin configuration (route, entryUrl, framework, etc.)

### Phase 5: External Component Build
1. Provide build templates for external developers:
   - Angular: Build as UMD or standalone bundle
   - React: Build with Module Federation
   - HTML: Static HTML files
2. Document plugin submission process

---

## File Structure

```
POC-Monorepo/
├── apps/
│   └── shell/
│       ├── src/
│       │   ├── App.tsx (updated - dynamic routes)
│       │   ├── components/
│       │   │   ├── Layout.tsx (updated - dynamic navbar)
│       │   │   └── DynamicRoute.tsx (new)
│       │   └── ...
│       └── webpack.config.js (add Module Federation)
│
├── packages/
│   ├── plugin-registry/ (new)
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── PluginRegistry.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── plugin-loader/ (new)
│   │   ├── src/
│   │   │   ├── loaders/
│   │   │   │   ├── ReactLoader.ts
│   │   │   │   ├── AngularLoader.ts
│   │   │   │   └── HtmlLoader.ts
│   │   │   ├── PluginLoader.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── k11-inbox/ (existing - internal)
│   ├── k11-monitoring/ (existing - internal)
│   └── design-system/ (existing)
│
└── ...
```

---

## Backend API Contract

Your Java backend should provide:

```json
GET /api/plugins
Response: [
  {
    "id": "external-app-1",
    "name": "External App",
    "route": "/external-app",
    "framework": "angular",
    "entryUrl": "https://cdn.example.com/apps/external-app/main.js",
    "manifestUrl": "https://cdn.example.com/apps/external-app/manifest.json",
    "version": "1.0.0",
    "enabled": true,
    "metadata": {
      "title": "External Application",
      "icon": "https://cdn.example.com/icons/app-icon.svg",
      "description": "Third-party application"
    }
  }
]
```

---

## Benefits

1. ✅ **Separation**: Internal modules (build-time) vs External plugins (runtime)
2. ✅ **Flexibility**: Support multiple frameworks (Angular, React, Vue, HTML)
3. ✅ **Dynamic**: Add/remove plugins without rebuilding shell
4. ✅ **API-Driven**: Route configuration from database
5. ✅ **Scalable**: Easy for external developers to integrate
6. ✅ **Backward Compatible**: Existing internal modules continue to work

---

## Migration Path

1. **Keep existing setup** for internal modules (k11-inbox, k11-monitoring)
2. **Add plugin system** alongside existing modules
3. **Gradually migrate** if needed, or keep both approaches
4. **External components** use new plugin system
5. **Internal components** can stay as-is or migrate to plugins

This hybrid approach gives you the best of both worlds: fast, optimized internal modules and flexible, runtime-loaded external plugins.

