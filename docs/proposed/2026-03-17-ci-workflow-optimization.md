# Proposed: CI Workflow Optimization (2026-03-17)

Documentation and agent instruction updates are currently triggering full release builds (including Docker builds and versioning) across multiple repositories. This is inefficient and causes unnecessary delays.

## 1. Motivation

Recent PRs for centralizing agent instructions triggered:

- `cv-backend`: Release workflow (Docker Build, Versioning)
- `cv`: Release workflow
- `cv-admin`: Release workflow

These changes were exclusively to `.md` files and `.agent/` directories, which do not affect the compiled application or container images.

## 2. Technical Plan

Implement `paths-ignore` for the `on: push` and `on: pull_request` triggers in major application workflows.

### Standard Exclusion List

```yaml
paths-ignore:
  - "README.md"
  - "docs/**"
  - ".agent/**"
  - "LICENSE"
  - ".gitignore"
```

### Targets

Separated by repository:

#### cv

- `.github/workflows/release.yml`

#### cv-admin

- `.github/workflows/release.yml`

#### cv-backend

- `.github/workflows/release.yml`
- `.github/workflows/ci-external.yml`

#### cv-admin-backend

- `.github/workflows/release.yml` (Update existing filters to include `.agent/**`)

#### cv-env

- `.github/workflows/lint.yml` (If applicable)

## 3. Verification Plan

- Manually trigger a documentation-only change (e.g., update a README) on a feature branch.
- Verify that the release workflows are NOT triggered.
- Manually trigger a code change (e.g., update a `.ts` file).
- Verify that the release workflows ARE triggered as expected.
