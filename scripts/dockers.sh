#!/bin/bash
# dockers - Docker Compose + SOPS wrapper
# This script is part of modern-resume-env
set -e

SOPS_FILE="local.enc.env"

# 1. Detect secrets
USE_SOPS=false
if [ -f "$SOPS_FILE" ]; then
	USE_SOPS=true
fi

# 2. Execute command
# If the first argument is "compose", shift it to avoid "docker compose compose"
DOCKER_CMD=("docker" "compose")
if [[ "$1" == "compose" ]]; then
	shift
fi

if [ "$USE_SOPS" = true ]; then
	# Only attempt decryption if we have a way to decrypt
	if [ -n "$SOPS_AGE_KEY_FILE" ] || [ -n "$SOPS_AGE_KEY" ]; then
		# Use sops exec-env to inject secrets into the environment for docker compose
		exec sops exec-env "$SOPS_FILE" -- "${DOCKER_CMD[@]}" "$@"
	else
		echo "⚠️ Warning: $SOPS_FILE found but no SOPS identities (SOPS_AGE_KEY_FILE or SOPS_AGE_KEY) are set. Running without SOPS." >&2
		exec "${DOCKER_CMD[@]}" "$@"
	fi
else
	exec "${DOCKER_CMD[@]}" "$@"
fi
