#!/usr/bin/env bash
set -euo pipefail

# Deploy Lumen to DigitalOcean droplet
# Usage: ./deploy.sh
# Requires: DEPLOY_SSH_PRIVATE_KEY env var or ~/.ssh/deploy_key

REMOTE_HOST="143.198.217.111"
REMOTE_USER="root"
REMOTE_DIR="/var/www/lumen"
PORT=3006

KEY_FILE="${SSH_KEY_FILE:-$HOME/.ssh/deploy_key}"

if [ ! -f "$KEY_FILE" ]; then
  if [ -n "${DEPLOY_SSH_PRIVATE_KEY:-}" ]; then
    mkdir -p ~/.ssh && chmod 700 ~/.ssh
    python3 -c "
import os
raw = os.environ['DEPLOY_SSH_PRIVATE_KEY']
parts = raw.split()
lines, i = [], 0
while i < len(parts):
    if parts[i] in ('-----BEGIN','-----END') and i+3 < len(parts):
        lines.append(' '.join(parts[i:i+4])); i += 4
    else:
        lines.append(parts[i]); i += 1
print('\n'.join(lines))
" > "$KEY_FILE"
    chmod 600 "$KEY_FILE"
  else
    echo "No SSH key found. Set DEPLOY_SSH_PRIVATE_KEY or place key at $KEY_FILE"
    exit 1
  fi
fi

SSH_CMD="ssh -o StrictHostKeyChecking=no -i $KEY_FILE"
SCP_CMD="scp -o StrictHostKeyChecking=no -i $KEY_FILE"

echo "Packing deployment..."
tar czf /tmp/lumen-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.next' \
  --exclude='data/store.json' \
  --exclude='data/uploads/*' \
  --exclude='public/uploads/*' \
  .

echo "Uploading to $REMOTE_HOST..."
$SCP_CMD /tmp/lumen-deploy.tar.gz $REMOTE_USER@$REMOTE_HOST:/tmp/lumen-deploy.tar.gz

echo "Deploying on server..."
$SSH_CMD $REMOTE_USER@$REMOTE_HOST bash <<REMOTE
set -e
cd $REMOTE_DIR
tar xzf /tmp/lumen-deploy.tar.gz
rm /tmp/lumen-deploy.tar.gz
mkdir -p data/uploads public/uploads
npm ci
npm run build
pm2 restart lumen || pm2 start ecosystem.config.cjs
pm2 save
sleep 3
STATUS=\$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$PORT/)
echo "Health check: \$STATUS"
[ "\$STATUS" = "200" ] && echo "Deploy successful!" || echo "Warning: health check returned \$STATUS"
REMOTE

rm /tmp/lumen-deploy.tar.gz
echo "Done."
