# Environment Variables Configuration

## Overview

This document explains all environment variables used by the Shell app.

## File Locations

- **Development**: `.env` (create this file in `apps/shell/`)
- **Template**: See `.env.example` for reference

## Environment Variables

### `USE_MOCK_PLUGINS` (Optional, Development Only)

- **Default**: `false` (uses backend API)
- **Description**: Use mock plugins instead of API for local development
- **When to use**: Set to `true` for local development when backend API is not available
- **Example**: `USE_MOCK_PLUGINS=true`

## Example .env File

```bash
# Use mock plugins instead of API (for local development)
# Set to true to use MOCK_PLUGINS from PluginRegistry.ts
USE_MOCK_PLUGINS=true
```

## Production

Production uses the backend API by default. No environment variables are needed.

## Creating .env Files

1. **Development**: Copy `.env.example` to `.env` and update values as needed
2. **Git**: `.env` files are gitignored (see `.gitignore`), so they won't be committed
