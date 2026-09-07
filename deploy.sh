#!/usr/bin/env bash
set -euo pipefail

# Deploy Lumen to DigitalOcean droplet
# Usage: ./deploy.sh
# Requires: DEPLOY_SSH_PRIVATE_KEY env var or ~/.ssh/deploy_key
# Optional: GEMINI_API_KEY (or GOOGLE_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY)

REMOTE_HOST="${DEPLOY_HOST:-143.198.217.111}"
REMOTE_USER="${DEPLOY_USER:-root}"
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

GEMINI_KEY_VALUE="${GEMINI_API_KEY:-${GOOGLE_GENERATIVE_AI_API_KEY:-${GOOGLE_API_KEY:-}}}"
GEMINI_MODEL_VALUE="${GEMINI_MODEL:-gemini-2.5-flash}"

echo "Packing deployment..."
tar czf /tmp/lumen-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.next' \
  --exclude='.env.local' \
  --exclude='data/store.json' \
  --exclude='data/uploads/*' \
  --exclude='public/uploads/*' \
  .

echo "Uploading to $REMOTE_HOST..."
$SCP_CMD /tmp/lumen-deploy.tar.gz $REMOTE_USER@$REMOTE_HOST:/tmp/lumen-deploy.tar.gz

if [ -n "$GEMINI_KEY_VALUE" ]; then
  umask 077
  cat > /tmp/lumen.env.local <<EOF
GEMINI_API_KEY=$GEMINI_KEY_VALUE
GEMINI_MODEL=$GEMINI_MODEL_VALUE
EOF
  $SCP_CMD /tmp/lumen.env.local $REMOTE_USER@$REMOTE_HOST:/tmp/lumen.env.local
  rm -f /tmp/lumen.env.local
  echo "Gemini key staged for server"
else
  echo "No GEMINI_API_KEY in deploy env — will keep existing server .env.local if present"
fi

echo "Deploying on server..."
$SSH_CMD $REMOTE_USER@$REMOTE_HOST bash <<REMOTE
set -e
cd $REMOTE_DIR
if [ -f .env.local ]; then cp .env.local /tmp/lumen.env.local.bak; fi
tar xzf /tmp/lumen-deploy.tar.gz
rm /tmp/lumen-deploy.tar.gz
if [ -f /tmp/lumen.env.local ]; then
  mv /tmp/lumen.env.local .env.local
  chmod 600 .env.local
  echo "Installed fresh .env.local with Gemini key"
elif [ -f /tmp/lumen.env.local.bak ]; then
  mv /tmp/lumen.env.local.bak .env.local
  echo "Restored previous .env.local"
fi
mkdir -p data/uploads public/uploads

npm ci
npm run build

pm2 delete lumen 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

sleep 3
STATUS=\$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$PORT/)
AI=\$(curl -s http://127.0.0.1:$PORT/api/ai-status || true)
echo "Health check: \$STATUS"
echo "AI status: \$AI"
[ "\$STATUS" = "200" ] && echo "Deploy successful!" || echo "Warning: health check returned \$STATUS"
REMOTE

rm /tmp/lumen-deploy.tar.gz
echo "Done."
