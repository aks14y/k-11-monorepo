# Frontend Monorepo Architecture

## Table of Contents
1. [Repository Structure](#repository-structure)
2. [Package Dependencies](#package-dependencies)
3. [Build Architecture](#build-architecture)
4. [Development Flow](#development-flow)
5. [Production Flow](#production-flow)
6. [Deployment Architecture](#deployment-architecture)

---

## Repository Structure

```
POC-Monorepo/
│
├── apps/
│   └── shell/                    # Host Application
│       ├── src/                  # Source code
│       │   ├── App.tsx          # Main app with routing
│       │   ├── bootstrap.tsx    # Entry point
│       │   ├── components/      # Shell components
│       │   └── context/         # Auth & App contexts
│       ├── dist/                # Production build output
│       ├── webpack.config.js    # Bundling configuration
│       └── package.json
│
├── packages/
│   ├── design-system/           # Shared UI Components
│   │   ├── src/
│   │   │   ├── components/      # Button, Card, Input, etc.
│   │   │   ├── design-tokens.ts # Colors, spacing, typography
│   │   │   └── ThemeProvider.tsx
│   │   └── dist/                # Compiled output
│   │
│   ├── k11-inbox/               # Inbox Feature Module
│   │   ├── src/
│   │   │   └── InboxApp.tsx    # Feature component
│   │   └── dist/               # Compiled output
│   │
│   ├── k11-monitoring/          # Monitoring Feature Module
│   │   ├── src/
│   │   │   └── MonitoringApp.tsx
│   │   └── dist/               # Compiled output
│   │
│   ├── types/                   # Shared TypeScript Types
│   │   └── src/
│   │       └── index.ts        # AuthUser, etc.
│   │
│   └── utils/                   # Shared Utilities
│       ├── src/
│       └── dist/
│
├── pnpm-workspace.yaml          # Workspace configuration
├── turbo.json                   # Build orchestration
├── tsconfig.json                # TypeScript config
└── .eslintrc.js                 # ESLint config
```

### Repository Structure Explanation

The repository follows a monorepo structure managed by pnpm workspaces and orchestrated by TurboRepo. The codebase is organized into two main directories: `apps/` and `packages/`.

**Apps Directory (`apps/`):**
The `apps/` directory contains the main application that users interact with. Currently, it houses the `shell` application, which serves as the host application for all feature modules. The shell application includes:
- `src/`: Contains all source code including the main `App.tsx` file that handles routing, `bootstrap.tsx` as the entry point, shell-specific components, and context providers for authentication and application state.
- `dist/`: The production build output directory where webpack bundles all code into optimized JavaScript files, CSS, and HTML.
- `webpack.config.js`: Configuration file that defines how webpack bundles the application, including module resolution, code splitting, and optimization settings.
- `package.json`: Defines dependencies, scripts, and metadata for the shell application.

**Packages Directory (`packages/`):**
The `packages/` directory contains reusable code that can be shared across applications. Each package is an independent module with its own `src/` and `dist/` directories:

- **`design-system/`**: A shared UI component library providing reusable React components like Button, Card, Input, Modal, and other design elements. It also includes design tokens (colors, spacing, typography) and a ThemeProvider for consistent styling across the application.

- **`k11-inbox/`**: A feature module that implements the inbox/notification functionality. It exports an `InboxApp` component that can be lazy-loaded by the shell application.

- **`k11-monitoring/`**: A feature module that implements monitoring dashboard functionality. It exports a `MonitoringApp` component that can be lazy-loaded by the shell application.

- **`types/`**: Shared TypeScript type definitions used across packages and applications. This ensures type consistency and enables better IDE support and compile-time error checking.

- **`utils/`**: Shared utility functions and helpers that can be used across different packages and applications.

**Root Configuration Files:**
- `pnpm-workspace.yaml`: Defines the workspace boundaries, telling pnpm which directories contain packages that should be linked together.
- `turbo.json`: Configures TurboRepo's build orchestration, defining task dependencies, outputs, and execution order.
- `tsconfig.json`: Root TypeScript configuration that provides base compiler options and path mappings for the entire monorepo.
- `.eslintrc.js`: ESLint configuration for code quality and consistency across the repository.

This structure enables code sharing, independent development of feature modules, and a single deployment artifact while maintaining clear boundaries between different parts of the application.

---

## Package Dependencies

### Dependency Graph

```
                    ┌─────────────────┐
                    │   apps/shell    │
                    │   (Host App)    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌──────────────┐   ┌──────────────┐
│ design-system │   │  k11-inbox   │   │k11-monitoring│
│  (Shared UI)  │   │  (Feature)   │   │  (Feature)   │
└───────┬───────┘   └──────┬───────┘   └──────┬───────┘
        │                  │                  │
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    @types    │
                    │  (Types)     │
                    └──────────────┘
```

### Dependency Details

**Shell App Dependencies:**
- `design-system` → UI components (Button, Card, Input, etc.)
- `k11-inbox` → Inbox feature (lazy loaded)
- `k11-monitoring` → Monitoring feature (lazy loaded)
- `types` → Shared TypeScript types

**Feature Modules Dependencies:**
- `design-system` → For UI components
- `types` → For type definitions
- `react`, `react-dom`, `styled-components` → Peer dependencies

---

## Build Architecture

### Build Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TurboRepo Orchestration                  │
│                    (turbo.json)                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  1. Analyze Dependency Graph       │
        │     - Find all packages            │
        │     - Determine build order        │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  2. Build Packages (Parallel)      │
        │                                     │
        │  Level 1 (No deps):                 │
        │  ├── @design-system ✅              │
        │  ├── @types ✅                      │
        │  └── utils ✅                       │
        │                                     │
        │  Level 2 (After Level 1):          │
        │  ├── k11-inbox ✅                   │
        │  └── k11-monitoring ✅              │
        │                                     │
        │  Level 3 (After Level 2):          │
        │  └── shell ✅                       │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  3. Output: apps/shell/dist/        │
        │     - index.html                   │
        │     - vendors.[hash].js           │
        │     - main.[hash].js               │
        │     - feature chunks (lazy)        │
        └───────────────────────────────────┘
```

### Build Architecture Explanation

The build process is orchestrated by TurboRepo, which ensures packages are built in the correct order based on their dependencies. The build follows a fresh build approach, meaning every build compiles all packages from source without relying on cached artifacts.

**Step 1: Dependency Graph Analysis**
When a build is initiated (via `pnpm build`), TurboRepo first analyzes the entire repository to understand the dependency relationships between all packages. It scans `package.json` files across all packages and applications to determine which packages depend on others. This analysis allows TurboRepo to create a build order that ensures dependencies are built before the packages that require them.

**Step 2: Parallel Package Building**
Once the dependency graph is established, TurboRepo builds packages in parallel where possible, respecting dependency constraints. The build process is organized into levels:

- **Level 1 (No Dependencies)**: Packages that don't depend on other workspace packages are built first. This includes `design-system` (shared UI components), `types` (TypeScript definitions), and `utils` (utility functions). These can all be built simultaneously since they have no internal dependencies.

- **Level 2 (Depends on Level 1)**: After Level 1 packages complete, feature modules like `k11-inbox` and `k11-monitoring` are built. These packages depend on `design-system` and `types` from Level 1, so they must wait for those to complete. However, `k11-inbox` and `k11-monitoring` can be built in parallel since they don't depend on each other.

- **Level 3 (Depends on Level 2)**: Finally, the `shell` application is built. It depends on all previous packages, so it must wait for all feature modules and shared packages to complete their builds.

Each package's build process involves TypeScript compilation (`tsc`), which transpiles TypeScript source files from `src/` into JavaScript output files in `dist/`. The TypeScript compiler also generates type declaration files (`.d.ts`) for packages that export types.

**Step 3: Output Generation**
After all packages are built, the shell application's webpack configuration bundles everything together. Webpack processes the shell's source code along with the compiled outputs from all packages, creating optimized production bundles. The final output in `apps/shell/dist/` includes:
- `index.html`: The main HTML file that loads the application
- `vendors.[hash].js`: A separate chunk containing all third-party dependencies (React, React Router, styled-components, etc.)
- `main.[hash].js`: The main application code including the shell app, routing logic, and shared components
- Feature chunks: Separate JavaScript files for lazy-loaded feature modules (e.g., `k11-inbox.[hash].js`, `k11-monitoring.[hash].js`)

The `[hash]` in filenames enables cache busting - when code changes, the hash changes, forcing browsers to download the new version instead of using cached files.

This build architecture ensures that:
- Dependencies are always built before dependents
- Parallel execution maximizes build speed
- Fresh builds guarantee no stale artifacts
- Output is optimized and ready for production deployment

---

## Development Flow

### Development Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Mode                          │
│              (pnpm dev:shell)                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  TurboRepo: Start Dev Tasks         │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Webpack Dev Server                │
        │  - Port: 3000                      │
        │  - HMR: Enabled                    │
        │  - Mode: Development                │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Module Resolution                  │
        │  USE_DIST=false                    │
        │                                     │
        │  Aliases point to:                 │
        │  ├── packages/*/src/               │
        │  └── (workspace linking)           │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Source Files (TypeScript)           │
        │  ├── apps/shell/src/                 │
        │  ├── packages/design-system/src/     │
        │  ├── packages/k11-inbox/src/         │
        │  └── packages/k11-monitoring/src/    │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Webpack Bundling                   │
        │  - Babel transpilation              │
        │  - Code splitting                   │
        │  - HMR updates                      │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Browser                            │
        │  - Fast refresh                     │
        │  - Live updates                     │
        └───────────────────────────────────┘
```

### Development Features

- **Workspace Linking**: Packages consumed from `src/` via symlinks
- **Hot Module Replacement**: Instant updates on code changes
- **Fast Rebuilds**: Only changed modules recompile
- **Source Maps**: Full debugging support
- **No Build Step**: Packages don't need to be built first

---

## Production Flow

### Production Build Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Mode                           │
│              (pnpm build)                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  TurboRepo: Orchestrate Builds      │
        │  dependsOn: ["^build"]              │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Step 1: Build Packages            │
        │  (TypeScript Compilation)          │
        │                                     │
        │  packages/design-system/          │
        │    src/ → dist/                     │
        │                                     │
        │  packages/k11-inbox/               │
        │    src/ → dist/                     │
        │                                     │
        │  packages/k11-monitoring/          │
        │    src/ → dist/                     │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Step 2: Build Shell App            │
        │  (Webpack Bundling)                 │
        │                                     │
        │  Module Resolution:                 │
        │  USE_DIST=true                      │
        │  Aliases point to:                  │
        │  ├── packages/*/dist/               │
        │  └── (compiled outputs)             │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Webpack Processing                 │
        │                                     │
        │  ├── Code Splitting                 │
        │  │   ├── vendors.js (React, etc.)  │
        │  │   └── main.js (app code)        │
        │  │                                   │
        │  ├── Lazy Loading                   │
        │  │   ├── k11-inbox chunk            │
        │  │   └── k11-monitoring chunk        │
        │  │                                   │
        │  ├── Optimization                   │
        │  │   ├── Minification               │
        │  │   ├── Tree shaking               │
        │  │   └── Prefetching                │
        │  │                                   │
        │  └── Output                         │
        │      └── apps/shell/dist/           │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Production Artifacts               │
        │                                     │
        │  apps/shell/dist/                   │
        │  ├── index.html                    │
        │  ├── vendors.[hash].js (4.0 MB)   │
        │  ├── main.[hash].js (135 KB)       │
        │  ├── k11-inbox.[hash].js (74 KB)  │
        │  └── k11-monitoring.[hash].js      │
        │      (35 KB)                       │
        └───────────────────────────────────┘
```

### Production Flow Explanation

The production build process transforms source code into optimized, deployable artifacts. This process is triggered by running `pnpm build` and follows a sequential, dependency-aware approach.

**TurboRepo Orchestration**
TurboRepo acts as the build orchestrator, reading the `turbo.json` configuration to understand task dependencies. The `dependsOn: ["^build"]` configuration ensures that when building the shell application, all its workspace dependencies (indicated by the `^` prefix) must be built first. This guarantees that compiled outputs from packages are available before the shell application attempts to bundle them.

**Step 1: Package Compilation**
Before the shell application can be bundled, all workspace packages must be compiled from TypeScript source to JavaScript. This step happens in parallel where possible, but respects dependency order:

- **`design-system`**: TypeScript files in `src/` are compiled to JavaScript in `dist/`. This includes all UI components, design tokens, and the ThemeProvider. The compiled output maintains the directory structure and includes both JavaScript files and TypeScript declaration files for type support.

- **`k11-inbox`**: The inbox feature module is compiled, transforming `InboxApp.tsx` and related files from TypeScript to JavaScript. The compiled output is placed in `dist/` and can be imported by the shell application.

- **`k11-monitoring`**: Similarly, the monitoring feature module is compiled, creating JavaScript outputs from TypeScript sources.

- **`types`** and **`utils`**: Shared packages are also compiled to ensure type definitions and utility functions are available in their compiled form.

Each package's compilation uses the TypeScript compiler configured in its `tsconfig.json`, which specifies compilation options like target JavaScript version, module system, and output directory.

**Step 2: Shell Application Bundling**
Once all packages are compiled, webpack bundles the shell application. The webpack configuration is set to production mode, which enables optimizations like minification, tree shaking, and code splitting.

**Module Resolution with `USE_DIST=true`**: In production mode, webpack's module resolution is configured to use compiled `dist/` outputs instead of source files. This is controlled by the `USE_DIST` environment variable, which is automatically set to `true` in production builds. Webpack aliases point to `packages/*/dist/` directories, ensuring the bundled application uses optimized, compiled code rather than raw TypeScript source.

**Webpack Processing**:
- **Code Splitting**: Webpack separates code into multiple chunks. Vendor dependencies (React, React Router, styled-components) are placed in a separate `vendors.js` chunk. This separation allows browsers to cache vendor code separately from application code, improving cache efficiency.

- **Lazy Loading**: Feature modules like `k11-inbox` and `k11-monitoring` are configured for lazy loading using `React.lazy()`. Webpack creates separate chunks for these modules that are only loaded when the user navigates to the corresponding routes.

- **Optimization**: Production builds apply several optimizations:
  - **Minification**: JavaScript code is compressed by removing whitespace, shortening variable names, and optimizing code structure, reducing file sizes by 40-60%.
  - **Tree Shaking**: Unused code is eliminated from the bundle. If a package exports multiple functions but only one is imported, only that function is included in the final bundle.
  - **Prefetching**: Webpack adds prefetch hints for lazy-loaded chunks, allowing browsers to download them during idle time before the user navigates to those routes.

**Output Generation**: The final output in `apps/shell/dist/` contains:
- `index.html`: The entry HTML file that loads the application
- `vendors.[hash].js`: Vendor dependencies chunk (approximately 4.0 MB)
- `main.[hash].js`: Main application code (approximately 135 KB)
- `k11-inbox.[hash].js`: Lazy-loaded inbox feature (approximately 74 KB)
- `k11-monitoring.[hash].js`: Lazy-loaded monitoring feature (approximately 35 KB)

The content hashes in filenames ensure that when code changes, browsers download new versions instead of using cached files.

**Production Features**:
- **Compiled Outputs**: All packages are built to `dist/` first, ensuring type safety and optimization
- **Optimized Bundles**: Code is minified, tree-shaken, and code-split for optimal performance
- **Lazy Loading**: Feature modules are loaded on-demand, reducing initial bundle size
- **Vendor Separation**: Third-party dependencies are in a separate chunk for better caching
- **Single Artifact**: Everything is bundled into `apps/shell/dist/`, ready for deployment

This production flow ensures that the final application is optimized, performant, and ready for deployment to any static hosting service or web server.

### Production Features

- **Compiled Outputs**: Packages built to `dist/` first
- **Optimized Bundles**: Minified, tree-shaken, code-split
- **Lazy Loading**: Feature modules loaded on-demand
- **Vendor Separation**: React, router, etc. in separate chunk
- **Single Artifact**: Everything bundled into `apps/shell/dist/`

---

## Deployment Architecture

### Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Pipeline                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Source Code (Git Repository)      │
        │  - apps/shell/src/                │
        │  - packages/*/src/                 │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  CI/CD Pipeline                    │
        │  (GitHub Actions, Jenkins, etc.)   │
        │                                     │
        │  1. Checkout code                  │
        │  2. Install dependencies           │
        │  3. Run: pnpm build                │
        │  4. Run tests (if any)             │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Build Output                     │
        │  apps/shell/dist/                 │
        │  ├── index.html                   │
        │  ├── vendors.[hash].js            │
        │  ├── main.[hash].js               │
        │  └── feature chunks               │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Deployment Target                 │
        │                                     │
        │  Options:                          │
        │  ├── Static Hosting (CDN)          │
        │  │   - Vercel, Netlify, S3         │
        │  │   - Serve dist/ as static files │
        │  │                                 │
        │  ├── Web Server                    │
        │  │   - Nginx, Apache               │
        │  │   - Serve dist/ directory      │
        │  │                                 │
        │  └── Container                     │
        │      - Docker image                │
        │      - Serve with nginx/node       │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Production Environment            │
        │  - Users access via browser        │
        │  - Routes handled by React Router   │
        │  - Lazy chunks loaded on-demand     │
        └───────────────────────────────────┘
```

---

## Runtime Architecture

### Browser Runtime Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (User)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Initial Load                      │
        │  GET /index.html                   │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  HTML Parsing                      │
        │  - Load vendors.js (4.0 MB)        │
        │  - Load main.js (135 KB)           │
        │  - Execute React app                │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  React Router Initialization       │
        │  - Render shell app                │
        │  - Show Dashboard (/)              │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Prefetching (Idle Time)           │
        │  - Prefetch k11-inbox chunk        │
        │  - Prefetch k11-monitoring chunk   │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  User Navigation                   │
        │  - Clicks "/inbox" link            │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Lazy Load Feature                 │
        │  - Load k11-inbox chunk (74 KB)   │
        │  - Render InboxApp                 │
        │  - Display user email              │
        └───────────────────────────────────┘
```

### Bundle Loading Strategy

```
Initial Load:
┌─────────────────────────────────────┐
│  vendors.js (4.0 MB)                 │
│  ├── React                          │
│  ├── React DOM                      │
│  ├── React Router                   │
│  ├── Styled Components              │
│  └── Other dependencies             │
└─────────────────────────────────────┘
         +
┌─────────────────────────────────────┐
│  main.js (135 KB)                    │
│  ├── Shell app code                 │
│  ├── Routing logic                  │
│  ├── Auth context                   │
│  └── Layout components              │
└─────────────────────────────────────┘

Lazy Loaded (On-Demand):
┌─────────────────────────────────────┐
│  k11-inbox.[hash].js (74 KB)        │
│  └── InboxApp component             │
└─────────────────────────────────────┘
         +
┌─────────────────────────────────────┐
│  k11-monitoring.[hash].js (35 KB)   │
│  └── MonitoringApp component         │
└─────────────────────────────────────┘
```

---

## Data Flow

### Context and Props Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Flow                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  AuthContext (Shell)                │
        │  - Stores: user.email               │
        │  - Provides: login/logout            │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  App.tsx (Shell)                   │
        │  - Reads: user from useAuth()     │
        │  - Passes: userEmail as prop      │
        └───────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                         │
        ▼                                         ▼
┌──────────────────┐                  ┌──────────────────┐
│  InboxApp         │                  │  MonitoringApp   │
│  (k11-inbox)      │                  │  (k11-monitoring) │
│                   │                  │                   │
│  Receives:        │                  │  Receives:        │
│  - userEmail      │                  │  - userEmail      │
│    (as prop)      │                  │    (as prop)      │
│                   │                  │                   │
│  Displays:        │                  │  Displays:        │
│  - Email in UI    │                  │  - Email in UI    │
└──────────────────┘                  └──────────────────┘
```

---

## Key Architectural Decisions

### 1. Monorepo Structure
- **Why**: Single source of truth, shared code, consistent versions
- **How**: pnpm workspaces + TurboRepo orchestration

### 2. Build Everything Together
- **Why**: Single deployable artifact, no runtime loading complexity
- **How**: Packages compile to `dist/`, shell bundles everything

### 3. Code Splitting
- **Why**: Faster initial load, better caching
- **How**: Vendor chunk separation, lazy-loaded feature modules

### 4. Workspace Linking (Dev) vs Dist (Prod)
- **Why**: Fast HMR in dev, optimized builds in prod
- **How**: `USE_DIST` flag switches between `src/` and `dist/`

### 5. Feature Flags
- **Why**: Customer-specific builds, compile-time exclusion
- **How**: `ENABLE_K11_INBOX`, `ENABLE_K11_MONITORING` env vars

### 6. Fresh Builds Every Time
- **Why**: Ensures consistency, avoids stale artifacts
- **How**: All packages and shell app built from source on every build

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Technology Stack                         │
└─────────────────────────────────────────────────────────────┘

Package Management:
├── pnpm (workspace protocol)
└── pnpm-workspace.yaml

Build System:
├── TurboRepo (task orchestration)
├── Webpack 5 (bundling)
├── TypeScript (compilation)
└── Babel (transpilation)

Frontend Framework:
├── React 18
├── React Router 6
└── Styled Components 6

Development:
├── Webpack Dev Server (HMR)
├── TypeScript (type checking)
└── ESLint (linting)
```

---

## Performance Characteristics

### Bundle Sizes
- **Vendors**: 4.0 MB (React, router, styled-components)
- **Main**: 135 KB (Shell app code)
- **k11-inbox**: 74 KB (Lazy loaded)
- **k11-monitoring**: 35 KB (Lazy loaded)
- **Total**: ~4.24 MB (but only 4.135 MB initial load)

### Build Times
- **Full build**: 8-10 seconds
- **CI build**: 8-10 seconds (fresh build every time)

### Load Performance
- **Initial load**: ~1.5-2 seconds (4G)
- **Time to Interactive**: ~2 seconds
- **Lazy chunk load**: ~200-500ms

---

## Summary

This architecture provides:
1. ✅ **Modular Structure**: Independent feature modules
2. ✅ **Shared Code**: Design system and types
3. ✅ **Fast Development**: Workspace linking, HMR
4. ✅ **Optimized Production**: Code splitting, lazy loading
5. ✅ **Consistent Builds**: Fresh builds ensure no stale artifacts
6. ✅ **Scalable**: Easy to add new feature modules
7. ✅ **Maintainable**: Clear boundaries and dependencies

The setup balances development speed with production performance, using modern tooling (TurboRepo, Webpack, pnpm) to create an efficient monorepo architecture.


