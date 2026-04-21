# Proposed Standards for Development Environment & CI Integration

## 0. Motivation

Our current development workflows suffer from fragmentation and friction:

- **Environment Drift**: Inconsistent configurations between developer machines, CI pipelines, and production clusters lead to "it works on my machine" bugs.
- **Secret Complexity**: Managing secrets across GitHub Secrets, SOPS, and local environment files creates a high cognitive load and risk of leakage.
- **Cross-Service Friction**: Bringing up a fullstack environment that spans multiple repositories is manual, slow, and error-prone.
- **Feedback Loops**: Inefficient iterative cycles due to lack of standardized "hot reload" patterns across standalone and containerized setups.

This proposal establishes a "Shared Environment" standard that unifies these disparate workflows into a single, cohesive approach using Bun, SOPS, and Docker Compose.

## 1. Industry Alignment

The proposal strongly aligns with modern GitOps and reproducible environment philosophies. The adoption of Nix (via flakes), SOPS for Git-versioned secrets, Bun for execution speed, and Zod for schema-first environment validation represents a highly mature, state-of-the-art stack.

We prioritize using established industry tools (like Docker Compose Watch and Telepresence) over custom-built scripts for remote cluster bridging and hot-reloading to minimize maintenance overhead and ensure reliability.

## 2. Goal

Establish a consistent, secure, and easy-to-use development environment across all labmtl repositories. This standardizes how developers bring up infrastructure, run fullstack systems, execute tests, and manage secrets.

## 3. Shared Secret Management & Overrides

### The `buns` Wrapper (Bun + SOPS)

We introduce a `buns` script integrated into the `cv-env` flake. This manages the loading of encrypted secrets automatically.

- **Standard Shared Secrets**: `local.enc.env`
  - **Naming**: The name `local.enc.env` explicitly signifies it is **local** to the repository scope, **encrypted**, and an **environment** file.
  - **Usage**: Contains secrets shared among the team (e.g., test database URLs, mock API keys).

- **Developer Overrides & Preferences**
  - **Problem**: Developers often need to override specific variables or test new features without committing them to the shared `local.enc.env`.
  - **Solution**: Use `.env.local` (unencrypted, **gitignored**).
  - **Precedence Note**: `sops exec-env` injects secrets directly into the OS process environment. Since standard `.env` loaders (including Bun's) generally do not overwrite pre-existing OS environment variables, custom merging logic or specific export patterns may be required to ensure `.env.local` takes precedence correctly.

### Standard `buns` Execution Flow

1. **Check**: Does `local.enc.env` exist?
2. **Execute**:
   - If yes: `sops exec-env local.enc.env bun "$@"`
   - If no: `bun "$@"`
3. **Environment Validation (Built-in)**: Before starting the sub-process, `buns` will:
   - Load the service's `src/configSchema.ts` (using `bun install` + `bun run` or a lightweight validator).
   - Validate that all required variables are present and correctly typed.
   - **Strict Mode**: Ensure **no unknown extraneous variables** are present in the environment that are not defined in the schema (to prevent configuration pollution).
4. **Runtime Loading**: Bun will then automatically load any `.env` or `.env.local` files present in the directory as part of its native process.

## 4. Docker Compose Standardization

All repositories should follow a consistent `docker-compose.yml` structure.

### Environment Sharing (YAML Anchors)

Use YAML anchors to define a `common-env` block.

```yaml
x-environment: &common-env
  DATABASE_URL: "postgres://postgres:postgres@postgres:5432/db_name"
  NODE_ENV: "${NODE_ENV:-development}"

services:
  backend:
    environment:
      <<: *common-env
```

### Docker Compose Profiles

| Profile | Purpose |
| :--- | :--- |
| `infra` | Core infrastructure only (DB, Redis, MinIO, etc.). |
| `fullstack` | The current service + all dependencies (pulled images). |
| `test` | Configuration for running automated tests. |

## 5. Standardized `package.json` Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `dev` | `buns run --hot src/index.ts` | Runs the service locally with secrets and hot-reload. |
| `infra:up` | `docker compose --profile infra up -d` | Brings up infrastructure. |
| `infra:down` | `docker compose --profile infra down -v` | Tears down infra. |
| `test:unit` | `bun test tests/unit` | Runs unit tests (no secrets). |
| `test:int` | `buns test tests/integration` | Runs integration tests (requires secrets). |
| `watch` | `docker compose watch` | (New) Uses Docker Compose Watch for hot-reloads. |

## 6. CI Integration & Secret Management

The CI environment uses the same `buns` and Docker profiles.

### The GitHub Bot Pattern

1. **Age Key**: Generate a specific `age` key for the "GitHub Bot".
2. **SOPS Config**: Add the public key to `.sops.yaml`.
3. **GitHub Secret**: Store the private key in `SOPS_AGE_KEY`.
4. **Encrypted File**: Create `ci.enc.env` containing CI-specific secrets.

## 7. Iterative Development & Hot Reload

### Local Development

Use `bun --hot` for immediate feedback:

```bash
buns run --hot src/index.ts
```

### Containerized Hot-Reload (Docker Compose Watch)

Instead of naive volume mounts (which can inject incompatible host `node_modules` or native binaries), we use **Docker Compose Watch**. This synchronizes specific source files into the container without overriding the internal `/app/node_modules`.

```yaml
services:
  backend:
    build: .
    x-develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
          ignore:
            - node_modules/
        - action: rebuild
          path: package.json
```

## 8. Remote Infrastructure Connection

For connecting local development to deployed environments (Staging/Dev), we recommend using industry-standard tools rather than custom bridging scripts.

### Recommended Tools

- **Telepresence**: Bridges your local machine into the Kubernetes cluster network, handling DNS resolution and bidirectional traffic.
- **DevSpace**: Facilitates rapid development on Kubernetes by automating port-forwarding, log streaming, and remote debugging.

## 9. Environment Variable Validation

To prevent runtime failures due to missing or misconfigured variables, we standardize on a "Schema-First" approach.

### Zod-Based Validation (Standard)

All services should maintain a `src/configSchema.ts` using Zod for "Schema-First" validation.

- **Enforcement via `buns`**: The `buns` wrapper acts as the primary gatekeeper, performing validation before the service even starts.
- **Runtime Check**: Services should still perform a secondary `configSchema.safeParse()` at startup for defense-in-depth.
- **Strict Validation**: The validation should be "strict," failing if the environment contains variables not explicitly declared in the Zod schema.
- **Documentation**: Use Zod's `.describe()` metadata to serve as the source of truth for documentation.

### Descriptive YAML/Sample Generation

We can automate the generation of `.env.sample` and descriptive YAML files from the Zod schema. This ensures the sample is always up-to-date with the actual code requirements.

### Example Schema Snippet

```typescript
export const configSchema = z.object({
  DATABASE_URL: z.string().url().describe("PostgreSQL connection string"),
  BETTER_AUTH_SECRET: z.string().min(32).describe("Encryption key for BetterAuth"),
  // ...
});
```

## 10. Usage Scenarios

### Scenario A: Local Standalone Development

**Goal**: Work on a specific service (e.g., `cv-backend`) with minimal overhead.

1. `bun run infra:up` (Brings up Postgres, Minio, etc.)
2. `buns run dev` (Runs the service locally, loading secrets from `local.enc.env`)
3. `bun run test:unit` (For fast feedback on logic changes)

### Scenario B: Cross-Service Integration

**Goal**: Test interactions between different components (e.g., Admin UI and Admin Backend).

1. In `cv-admin`, run `docker compose --profile fullstack up -d`.
2. This pulls the latest `cv-admin-backend` image and starts it alongside its required infra.
3. Develop the frontend locally against the containerized backend.

### Scenario C: Hybrid Remote Debugging

**Goal**: Point a local service to a deployed staging/dev cluster.

1. `telepresence connect` (Connects local network to the cluster).
2. `buns run dev` (Loads local secrets but interacts with remote cluster services via DNS).

## 11. Implementation Roadmap

To maintain stability and minimize risk across the entire ecosystem, we will adopt an **incremental implementation** strategy:

- **Phase 1 (Pilot)**: Implement the standard in `cv-admin-backend`. This serves as our validation ground.
- **Phase 2 (Evaluation)**: Refine the `buns` script and Docker patterns based on Phase 1 feedback.
- **Phase 3 (Rollout)**: Systematically update other repositories (`cv-backend`, frontends, etc.).

## 11. Affected Repositories

| Repository | Component Type | Primary Stack |
| :--- | :--- | :--- |
| `cv` | Frontend | Vue 3, Vite |
| `cv-admin` | Admin Frontend | Vue 3, Vite |
| `cv-admin-backend` | Admin Backend API | Hono, Prisma, Bun |
| `cv-backend` | Core Backend & Worker | Hono, Prisma, Bun |
| `cv-env` | Shared Environment | Nix, SOPS, Pre-commit |
| `cv-infra` | Infrastructure | Terraform, Flux, Kubernetes |

## 12. Critical Analysis

### Criticisms & Potential Problems

- **Precedence Conflict**: OS-level environment variables (from `sops exec-env`) usually take precedence over `.env` files. Overriding shared secrets with `.env.local` requires custom merging logic.
- **Architecture Mismatch**: Standard volume mounts (`.:/app`) crash when host (macOS) and container (Linux) have different native binaries. *Fix: Use Docker Compose Watch.*
- **Offboarding Friction**: Shared `local.enc.env` keys must be rotated and files re-encrypted when a developer leaves.
- **OIDC vs Static Keys**: While a single `SOPS_AGE_KEY` is simple, OIDC Federation (linking GitHub to AWS/Vault) is more secure for CI secret management.

### Alternatives

| Component | Proposed | Recommendation |
| :--- | :--- | :--- |
| **Remote Bridge** | Custom Scripts | **Telepresence / DevSpace** |
| **Secret Injection**| SOPS + `buns` | **1Password CLI / Infisical** |
| **Hot Reload** | Volume Mounts | **Docker Compose Watch** |
| **CI Secrets** | Static SOPS Key | **OIDC Federation** |
