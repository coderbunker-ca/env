# Proposed Logging Package: `@cv/observability`

## Goal

Standardize and centralize logging, observability, and telemetry initialization across the labmtl ecosystem to eliminate code duplication and ensure consistent formatting/metadata.

## Package Content

### 1. Backend Logging (Pino)

- **`createLogger(name: string, options?: LoggerOptions)`**:
  - Pre-configured with standard metadata (app name, version).
  - Environment-aware formatting (JSON in prod, pretty-print in dev).
  - Built-in evaluation of `LOG_LEVEL` and `HONO_LOGGER`.
  - Common redact paths for PII (emails, passwords, API keys).

### 2. Frontend Observability (Faro)

- **`initializeTelemetry(config: FaroConfig)`**:
  - Wrapper around `@grafana/faro-web-sdk`.
  - Handles environment-based activation (`FARO_ENABLED`).
  - Standardizes dynamic metadata injection from `package.json`.
  - Consistent URL configuration (`FARO_TELEMETRY_URL`).

### 3. Shared Utilities

- **`evaluateTruthy(value: any): boolean`**: The helper used for `HONO_LOGGER`, `FARO_ENABLED`, etc.
- **Log Level Schemas**: Zod schemas for validating logging-related environment variables.

## Implementation Plan

1. Create a new package in `cv-env` (or a dedicated repo).
2. Export the `logger.ts` logic from `cv-backend`.
3. Export the `FaroInit` logic from `cv-admin`.
4. Update projects to depend on this package via workspace or private npm registry.

## Benefits

- **Consistency**: Single source of truth for log formats.
- **Maintainability**: Update logging library or transport in one place.
- **Ease of Use**: "Zero-config" setup for new microservices or frontend apps.
