# Proposed: CI Workflow Optimization (2026-03-17)

Documentation and agent instruction updates are currently triggering full release builds (including Docker builds and versioning) across multiple repositories. This is inefficient and causes unnecessary delays.

## 1. Motivation

Recent PRs for centralizing agent instructions triggered:

- `modern-resume-backend`: Release workflow (Docker Build, Versioning)
- `modern-resume`: Release workflow
- `modern-resume-admin`: Release workflow

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

#### modern-resume

- `.github/workflows/release.yml`

#### modern-resume-admin

- `.github/workflows/release.yml`

#### modern-resume-backend

- `.github/workflows/release.yml`
- `.github/workflows/ci-external.yml`

#### modern-resume-admin-backend

- `.github/workflows/release.yml` (Update existing filters to include `.agent/**`)

#### modern-resume-env

- `.github/workflows/lint.yml` (If applicable)

## 3. Verification Plan

- Manually trigger a documentation-only change (e.g., update a README) on a feature branch.
- Verify that the release workflows are NOT triggered.
- Manually trigger a code change (e.g., update a `.ts` file).
- Verify that the release workflows ARE triggered as expected.
