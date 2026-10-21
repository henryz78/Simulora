#!/usr/bin/env bash
# Puts what is committed on the public server: checks and builds here, sends server, shared and the built pages,
# swaps them in, restarts, and checks the site answers. If the new version does not start, the old one goes back.
# Data on the server is left alone. The server's address is in .deploy.env (not committed):
# DEPLOY_HOST=user@host, DEPLOY_PORT, DEPLOY_KEY (forward slashes), SITE.
set -euo pipefail
cd "$(dirname "$0")/.."
source <(tr -d '\r' < .deploy.env)
if [ -n "$(git status --porcelain)" ]; then
  echo "Commit first: the server gets what is committed." >&2
  exit 1
fi
npm run typecheck
npm run build
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
git archive -o "$tmp/deploy.tar" HEAD server shared package.json
# --force-local: tar on Windows otherwise reads "C:" in a path as another machine.
tar --force-local -rf "$tmp/deploy.tar" web/dist
scp -q -P "$DEPLOY_PORT" -i "$DEPLOY_KEY" "$tmp/deploy.tar" "$DEPLOY_HOST:/tmp/simulora-deploy.tar"
ssh -p "$DEPLOY_PORT" -i "$DEPLOY_KEY" "$DEPLOY_HOST" '
  set -e
  cd /opt/simulora
  # Unpacked aside first: a failed unpack leaves the running version untouched.
  rm -rf .new .prev && mkdir -p .new .prev/web
  tar -xf /tmp/simulora-deploy.tar -C .new
  rm /tmp/simulora-deploy.tar
  mv server shared package.json .prev/ && mv web/dist .prev/web/
  mv .new/server .new/shared .new/package.json . && mv .new/web/dist web/
  rm -rf .new
  systemctl restart simulora
  sleep 3
  if ! systemctl is-active --quiet simulora; then
    journalctl -u simulora -n 20 --no-pager
    echo "The new version did not start; putting the old one back." >&2
    rm -rf server shared package.json web/dist
    mv .prev/server .prev/shared .prev/package.json . && mv .prev/web/dist web/
    systemctl restart simulora
    exit 1
  fi'
curl --retry 5 --retry-connrefused --retry-delay 2 -fsS -o /dev/null "$SITE/api/samples"
echo "Deployed $(git log -1 --format='%h %s') to $SITE"
