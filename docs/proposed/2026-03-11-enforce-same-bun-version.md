# enforcing bun version consistently

can we add a shared pre-commit check to ensure we use the same bun version (and implicitly node version) across all our github workflows, package.json, Dockerfile, flake.nix, etc. Should not use latest tag. Test first with 1.3.8 and then update and retest for the latest stable (1.3.10).
