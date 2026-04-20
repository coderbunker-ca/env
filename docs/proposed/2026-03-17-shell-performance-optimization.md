# Proposed: Shell & Nix Performance Optimization (2026-03-17)

The current development environment suffers from high overhead due to frequent Nix flake re-evaluations during directory changes and shell initialization. This affects both human productivity and AI agent response times.

## 1. Motivation

Every time an AI agent or developer changes directories or runs a command in a multi-repo setup, `direnv` triggers a Nix evaluation. Without persistent caching, this adds seconds of latency to every interaction. Additionally, the `shellHook` in `cv-env` performs repetitive tasks like patching git hooks, which contributes to the slowdown.

## 2. Technical Plan

### A. Nix-Direnv Integration

Recommend the installation and use of `nix-direnv` for persistent caching of Nix shells.

- **Benefit**: Reduces shell load time from seconds to milliseconds after the first evaluation.
- **Action**: Update `USAGE.md` with setup instructions for `nix-direnv`.

### B. Agent Terminal Optimization (PROCESS.md)

Update `PROCESS.md` to formalize the use of `direnv exec` as a standard practice for AI agents.

- **Benefit**: Bypasses the overhead of interactive shell hooks and prompt evaluations entirely.
- **Action**: Add "Agent Terminal Optimization" section to `PROCESS.md`.

### C. Lazy Hook Loading

Optimize `cv-env/scripts/setup-hooks.sh` to only perform work when necessary.

- **Action**: Add checks to avoid re-patching git hooks if they already have the `direnv` loader.

### D. Flake Registry Pinning

Document and recommend pinning the `nixpkgs` input in the local registry.

- **Action**: `nix registry add nixpkgs github:NixOS/nixpkgs/<rev>`

## 3. Verification Plan

- Measure latency of `cd <repo>` before and after `nix-direnv` setup.
- Verify that `direnv exec <repo> <cmd>` works accurately without the shell hook latency.
- Confirm all tools (`gh`, `bun`, `tofu`) remain fully functional.
