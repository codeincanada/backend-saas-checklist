#!/usr/bin/env bash
# Deploy script for checklist.w-b.dev on rv415
# Executed by the self-hosted GitHub Actions runner on rv415 upon merge to main.
set -euo pipefail

DEPLOY_SHA="${DEPLOY_SHA:-${1:-}}"
if [[ -z "${DEPLOY_SHA}" ]]; then
  echo "Error: DEPLOY_SHA must be provided as an environment variable or argument." >&2
  exit 1
fi

REPO_SLUG="${GITHUB_REPOSITORY:-codeincanada/backend-saas-checklist}"
site_root="/home/ds/sites/checklist.w-b.dev"
releases_root="/home/ds/sites/.checklist.w-b.dev-releases"
release_dir="$releases_root/$DEPLOY_SHA"
staging_dir="$releases_root/.$DEPLOY_SHA.tmp"
next_link="/home/ds/sites/.checklist.w-b.dev.next"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

notify_failure() {
  local code=$?
  local env_file="/home/ds/scripts/server-report/.env"
  if [[ -f "$env_file" ]]; then
    # shellcheck disable=SC1090
    set -a; . "$env_file"; set +a
    if [[ -n "${SLACK_BOT_TOKEN:-}" && -n "${SLACK_NOTIFY_CHANNEL:-}" ]]; then
      local payload
      payload=$(python3 -c 'import json,os,sys; print(json.dumps({"channel":os.environ["SLACK_NOTIFY_CHANNEL"],"text":sys.argv[1]}))' \
        ":x: *Checklist deploy failed* (\`${DEPLOY_SHA:0:7}\`) — https://github.com/$REPO_SLUG/actions")
      curl -sS -X POST https://slack.com/api/chat.postMessage \
        -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$payload" >/dev/null || true
    fi
  fi
  exit "$code"
}
trap notify_failure ERR

log "Validating build artifacts"
if [[ ! -s dist/index.html ]]; then
  echo "Error: dist/index.html not found or empty. Did 'npm run build' run?" >&2
  exit 1
fi

log "Preparing release directory in $releases_root"
mkdir -p "$releases_root"
rm -rf "$staging_dir"
mkdir -p "$staging_dir"
cp -a dist/. "$staging_dir/"

cat > "$staging_dir/version.json" <<EOF
{"commit":"$DEPLOY_SHA","deployedAt":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
EOF

rm -rf "$release_dir"
mv "$staging_dir" "$release_dir"

# Convert initial static directory to retained release archive if not already a symlink
if [[ -d "$site_root" && ! -L "$site_root" ]]; then
  log "Archiving existing non-symlink site directory"
  mv "$site_root" "$releases_root/manual-$(date -u +%Y%m%dT%H%M%SZ)"
fi

log "Switching active symlink atomically"
rm -f "$next_link"
ln -s "$release_dir" "$next_link"
mv -Tf "$next_link" "$site_root"

log "Pruning old releases (keeping last 10)"
find "$releases_root" -maxdepth 1 -mindepth 1 -type d | grep -vE '/\.' | sort -r | tail -n +11 | xargs -r rm -rf 2>/dev/null || true

log "Verifying local origin"
origin_version=$(curl --fail --silent --show-error \
  -H "Host: checklist.w-b.dev" \
  http://127.0.0.1/version.json)
grep -Fq "\"commit\":\"$DEPLOY_SHA\"" <<<"$origin_version"

log "Verifying public endpoint (https://checklist.w-b.dev/version.json)"
for attempt in {1..12}; do
  public_version=$(curl --fail --silent --show-error \
    --connect-timeout 5 \
    --max-time 15 \
    https://checklist.w-b.dev/version.json 2>/dev/null || true)

  if grep -Fq "\"commit\":\"$DEPLOY_SHA\"" <<<"$public_version"; then
    log "Successfully deployed and verified commit $DEPLOY_SHA in production"
    exit 0
  fi
  sleep 5
done

echo "Warning: Public endpoint did not propagate commit $DEPLOY_SHA within 60s, but origin is verified." >&2
exit 0
