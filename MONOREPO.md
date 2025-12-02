# Monorepo Architecture & Boundaries

## Overview
This is a **pnpm workspace monorepo** managed by **TurboRepo**, implementing a modular architecture with a "build everything together" approach.

---

## Repository Structure

```
k11-monorepo/
├── apps/                    # Applications (deployable units)
│   └── shell/              # Host/Shell application
├── packages/                # Shared packages (libraries)
│   ├── design-system/     # UI component library
│   ├── k11-inbox/         # Inbox feature module
│   ├── k11-monitoring/    # Monitoring feature module
│   ├── types/             # Shared TypeScript types
│   ├── utils/             # Shared utilities
│   └── eslint-config/     # Shared ESLint configuration
├── pnpm-workspace.yaml     # Workspace configuration
├── turbo.json             # TurboRepo task orchestration
└── tsconfig.json          # Root TypeScript configuration
```

---

## Boundaries & Responsibilities

### 📱 **Apps/** - Applications Layer

#### **apps/shell/**
**Purpose:** Host application that orchestrates all feature modules

**Responsibilities:**
- ✅ Main entry point and routing (`App.tsx`, `bootstrap.tsx`)
- ✅ Authentication & authorization (`AuthContext`, `AppContext`)
- ✅ Layout and navigation (`Layout.tsx`)
- ✅ Webpack bundling configuration
- ✅ Environment variable management (`.env`, `.env.production`)
- ✅ Conditional module loading based on feature flags
- ✅ Production builds bundle everything into `apps/shell/dist/`

**Dependencies:**
- Consumes all packages via `workspace:*` protocol
- Uses `@design-system` for UI components
- Lazy loads `@mfes/k11-inbox` and `@mfes/k11-monitoring`
- Uses `@types` for shared type definitions

**Build Output:**
- Development: Uses `src/` files via workspace linking
- Production: Uses `dist/` outputs (packages built first via TurboRepo)

---

### 📦 **Packages/** - Shared Libraries Layer

#### **packages/design-system/**
**Purpose:** Shared UI component library and design tokens

**Responsibilities:**
- ✅ Reusable React components (`Button`, `Card`, `Input`, `Typography`, etc.)
- ✅ Design tokens (colors, spacing, typography, radii)
- ✅ Theme provider for styled-components
- ✅ Type-safe theme definitions

**Dependencies:**
- Peer dependencies: `react`, `react-dom`, `styled-components`
- No internal package dependencies

**Consumers:**
- `apps/shell`
- `packages/k11-inbox`
- `packages/k11-monitoring`
- Any future feature modules

---

#### **packages/k11-inbox/**
**Purpose:** Inbox/Notifications feature module

**Responsibilities:**
- ✅ Notification queue UI (`InboxApp.tsx`)
- ✅ Table with filtering, pagination, selection
- ✅ Self-contained feature module
- ✅ Can be conditionally included/excluded via `ENABLE_K11_INBOX` flag

**Dependencies:**
- `@design-system` (for UI components)
- `@types` (for shared types)
- Peer dependencies: `react`, `react-dom`, `styled-components`

**Consumers:**
- `apps/shell` (lazy loaded)

**Build Output:**
- `packages/k11-inbox/dist/` (TypeScript compiled output)

---

#### **packages/k11-monitoring/**
**Purpose:** Monitoring dashboard feature module

**Responsibilities:**
- ✅ Monitoring dashboard UI (`MonitoringApp.tsx`)
- ✅ Database and Backup monitoring cards
- ✅ Self-contained feature module
- ✅ Can be conditionally included/excluded via `ENABLE_K11_MONITORING` flag

**Dependencies:**
- `@design-system` (for UI components)
- `@types` (for shared types)
- Peer dependencies: `react`, `react-dom`, `styled-components`

**Consumers:**
- `apps/shell` (lazy loaded)

**Build Output:**
- `packages/k11-monitoring/dist/` (TypeScript compiled output)

---

#### **packages/types/**
**Purpose:** Shared TypeScript type definitions

**Responsibilities:**
- ✅ Common type definitions (`AuthUser`, etc.)
- ✅ Shared interfaces across packages
- ✅ Type exports for workspace packages

**Dependencies:**
- None (pure types package)

**Consumers:**
- All packages and apps that need shared types

---

#### **packages/utils/**
**Purpose:** Shared utility functions

**Responsibilities:**
- ✅ Reusable utility functions
- ✅ Helper functions used across packages

**Dependencies:**
- None (or minimal dependencies)

**Consumers:**
- Any package/app that needs utilities

---

#### **packages/eslint-config/**
**Purpose:** Shared ESLint configuration

**Responsibilities:**
- ✅ Common ESLint rules for the monorepo
- ✅ Consistent code style across packages

**Consumers:**
- All packages via `extends` in their ESLint configs

---

## Build Strategy

### **Development Mode**
- Uses `src/` files via **workspace linking** (`workspace:*` in package.json)
- Fast Hot Module Replacement (HMR)
- No build step required for packages
- Webpack aliases point to `packages/*/src/`

### **Production Mode**
- **TurboRepo** orchestrates builds: `dependsOn: ["^build"]`
- Packages compile first: `packages/*/src/` → `packages/*/dist/`
- Shell bundles everything: `apps/shell/src/` + `packages/*/dist/` → `apps/shell/dist/`
- Webpack aliases automatically switch to `packages/*/dist/` in production
- Single deployable artifact: `apps/shell/dist/`

---

## Dependency Rules

### ✅ **Allowed Dependencies**

1. **Apps can depend on:**
   - Any package in `packages/`
   - External npm packages
   - Workspace packages via `workspace:*`

2. **Packages can depend on:**
   - Other packages in `packages/` (e.g., `@design-system`, `@types`)
   - External npm packages
   - **NOT** on apps (no circular dependencies)

3. **Feature modules (k11-*) can depend on:**
   - `@design-system` (for UI)
   - `@types` (for types)
   - External packages
   - **NOT** on other feature modules (keep them independent)

### ❌ **Forbidden Dependencies**

- Apps cannot depend on other apps
- Packages cannot depend on apps
- Feature modules cannot depend on other feature modules
- No circular dependencies

---

## Feature Flags

Feature flags control compile-time inclusion/exclusion of feature modules:

- `ENABLE_K11_INBOX` - Controls inbox module (default: `true`)
- `ENABLE_K11_MONITORING` - Controls monitoring module (default: `true`)

**Location:** `.env` (development) and `.env.production` (production)

**Effect:**
- Webpack aliases are conditionally added
- Routes are conditionally rendered
- Navigation links are conditionally shown
- Unused modules are not bundled

---

## Workspace Configuration

### **pnpm-workspace.yaml**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```
Defines workspace boundaries for pnpm.

### **turbo.json**
- **Build tasks:** Dependencies ensure packages build before apps
- **Dev tasks:** Persistent (for dev servers)
- **Cache:** Enabled for faster rebuilds

---

## TypeScript Configuration

### **Root `tsconfig.json`**
- Base compiler options
- Path mappings for workspace packages:
  - `@mfes/k11-inbox` → `packages/k11-inbox/src/`
  - `@mfes/k11-monitoring` → `packages/k11-monitoring/src/`
  - `@design-system` → `packages/design-system/src/`
  - `@types` → `packages/types/src/`

### **Package `tsconfig.json`**
- Extends root config
- Package-specific overrides
- Outputs to `dist/` for production

---

## Environment Variables

### **Development (`.env`)**
- `USE_DIST=false` - Use `src/` files
- `ENABLE_K11_INBOX=true`
- `ENABLE_K11_MONITORING=true`
- `PORT=3000`

### **Production (`.env.production`)**
- `USE_DIST=true` - Use `dist/` files
- Feature flags for customer-specific builds

---

## Key Principles

1. **Single Source of Truth:** Shared code lives in `packages/`
2. **Build Everything Together:** Production bundles all into shell
3. **Conditional Inclusion:** Feature flags control module inclusion
4. **Type Safety:** Shared types ensure consistency
5. **Independent Modules:** Each feature module is self-contained
6. **Workspace Linking:** Development uses symlinks for speed
7. **Dist Outputs:** Production uses compiled outputs

---

## Commands

```bash
# Development
pnpm dev:shell              # Start shell dev server

# Build
pnpm build                  # Build all packages then shell
pnpm build --filter shell   # Build only shell (packages auto-built)

# Linting & Type Checking
pnpm lint                   # Lint all packages
pnpm typecheck              # Type check all packages
```

---

## Summary

**Added:**
- ✅ pnpm workspace configuration (`pnpm-workspace.yaml`)
- ✅ TurboRepo task orchestration (`turbo.json`)
- ✅ Root TypeScript configuration with path mappings
- ✅ Webpack configuration with conditional aliases
- ✅ Environment variable management (`.env` files)
- ✅ Feature flag system for conditional module inclusion
- ✅ Build strategy: `src/` for dev, `dist/` for production

**Set Up:**
- ✅ Monorepo boundaries: `apps/` (applications) and `packages/` (libraries)
- ✅ Dependency rules: Apps → Packages, Packages → Packages (no circular)
- ✅ Build orchestration: TurboRepo ensures correct build order
- ✅ Workspace linking: Fast development with `workspace:*` protocol
- ✅ Production bundling: Everything compiled and bundled together

