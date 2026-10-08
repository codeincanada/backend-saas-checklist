#!/usr/bin/env bash
# Install and register the backend-saas-checklist self-hosted GitHub Actions runner on rv415.
#
# Run this ON rv415. Get a short-lived registration token first:
#   gh api -X POST repos/codeincanada/backend-saas-checklist/actions/runners/registration-token --jq .token
#   RUNNER_TOKEN=<token> ./scripts/setup-cd-runner.sh
#
# It runs as user ds and installs a systemd service, so it survives reboots.
# Re-running with --replace re-registers.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/codeincanada/backend-saas-checklist}"
RUNNER_NAME="${RUNNER_NAME:-rv415-backend-saas-checklist}"
RUNNER_LABELS="${RUNNER_LABELS:-self-hosted,Linux,X64,rv415,checklist-production}"
RUNNER_DIR="${RUNNER_DIR:-/home/ds/actions-runner/backend-saas-checklist}"
: "${RUNNER_TOKEN:?Set RUNNER_TOKEN (registration token from GitHub API)}"

for command in curl tar; do
  command -v "$command" >/dev/null || { echo "Missing $command" >&2; exit 1; }
done

version=$(curl -fsSL https://api.github.com/repos/actions/runner/releases/latest | sed -n 's/.*"tag_name": *"v\([^"]*\)".*/\1/p')
[ -n "$version" ] || { echo "Could not determine runner version" >&2; exit 1; }

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"
if [ ! -x ./config.sh ]; then
  echo "→ downloading actions runner v$version"
  curl -fsSL -o actions-runner.tar.gz "https://github.com/actions/runner/releases/download/v${version}/actions-runner-linux-x64-${version}.tar.gz"
  tar xzf actions-runner.tar.gz && rm actions-runner.tar.gz
fi

echo "→ registering runner '$RUNNER_NAME' with labels '$RUNNER_LABELS'"
./config.sh --url "$REPO_URL" --token "$RUNNER_TOKEN" \
  --name "$RUNNER_NAME" --labels "$RUNNER_LABELS" --work _work --unattended --replace

echo "→ installing systemd service (user: $(id -un))"
sudo ./svc.sh install "$(id -un)"
sudo ./svc.sh start
sudo ./svc.sh status | head -10

echo "✓ runner installed. Verify status with:"
echo "  gh api repos/codeincanada/backend-saas-checklist/actions/runners --jq '.runners[]|{name,status,labels:[.labels[].name]}'"
