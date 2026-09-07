#!/usr/bin/env bash
# Deploy Kids Portfolio to portfolio.greednews.com on the existing DigitalOcean
# droplet, sitting behind Apache so greednews.com WordPress keeps :80/:443.
#
# Required env:
#   DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_PRIVATE_KEY
# Optional env:
#   DEPLOY_PORT (default 22)
#   ADMIN_EMAIL, ADMIN_PASSWORD  (generated on the server if omitted)
#   CLOUDFLARE_API_TOKEN         (creates the proxied A record)
#   POSTGRES_PASSWORD, NEXTAUTH_SECRET
set -euo pipefail

HOST="${DEPLOY_HOST:?set DEPLOY_HOST}"
USER="${DEPLOY_USER:?set DEPLOY_USER}"
PORT="${DEPLOY_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-/opt/kids-portfolio}"
DOMAIN="portfolio.greednews.com"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY_FILE="$(mktemp)"
cleanup() { rm -f "$KEY_FILE"; }
trap cleanup EXIT

python3 - "$KEY_FILE" <<'PY'
import os, pathlib, re, sys, textwrap
raw = os.environ["DEPLOY_SSH_PRIVATE_KEY"].strip().strip('"').strip("'")
raw = raw.replace("\\n", "\n").replace("\r\n", "\n").replace("\r", "\n")
m = re.match(r"-----BEGIN ([^-]+)-----\s*(.*?)\s*-----END \1-----", raw, re.S)
if not m:
    raise SystemExit("DEPLOY_SSH_PRIVATE_KEY is not a PEM/OpenSSH private key")
kind, body = m.group(1), re.sub(r"\s+", "", m.group(2))
wrapped = "\n".join(textwrap.wrap(body, 70))
pathlib.Path(sys.argv[1]).write_text(
    f"-----BEGIN {kind}-----\n{wrapped}\n-----END {kind}-----\n"
)
os.chmod(sys.argv[1], 0o600)
PY

SSH=(ssh -i "$KEY_FILE" -p "$PORT" -o BatchMode=yes -o IdentitiesOnly=yes
     -o StrictHostKeyChecking=accept-new
     "${USER}@${HOST}")
SCP=(scp -i "$KEY_FILE" -P "$PORT" -o BatchMode=yes -o IdentitiesOnly=yes
     -o StrictHostKeyChecking=accept-new)

echo "==> SSH ${USER}@${HOST}:${PORT}"
"${SSH[@]}" 'echo ok; id; hostname'

echo "==> Sync repo to ${REMOTE_DIR}"
"${SSH[@]}" "mkdir -p '${REMOTE_DIR}'"
tar --exclude=.git --exclude=node_modules --exclude=.next --exclude=uploads \
    -C "$ROOT" -czf - . | "${SSH[@]}" "tar -C '${REMOTE_DIR}' -xzf -"

echo "==> Install Docker if missing; enable Apache proxy modules"
"${SSH[@]}" bash -s <<'REMOTE'
set -euo pipefail
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
docker compose version >/dev/null
if command -v yum >/dev/null 2>&1; then
  yum install -y mod_ssl 2>/dev/null || true
fi
if [ -d /etc/httpd ]; then
  for m in proxy proxy_http ssl headers; do
    grep -q "LoadModule ${m}_module" /etc/httpd/conf.modules.d/*.conf 2>/dev/null || true
  done
  if command -v setsebool >/dev/null 2>&1; then
    setsebool -P httpd_can_network_connect 1 || true
  fi
fi
REMOTE

echo "==> Write .env on the droplet (does not overwrite existing secrets)"
# Pass optional secrets as base64 so values cannot break the remote script.
b64() { printf '%s' "$1" | base64 -w0 2>/dev/null || printf '%s' "$1" | base64; }
REMOTE_ADMIN_EMAIL_B64="$(b64 "${ADMIN_EMAIL:-parent@${DOMAIN}}")"
REMOTE_ADMIN_PASSWORD_B64="$(b64 "${ADMIN_PASSWORD:-}")"
REMOTE_NEXTAUTH_SECRET_B64="$(b64 "${NEXTAUTH_SECRET:-}")"
REMOTE_POSTGRES_PASSWORD_B64="$(b64 "${POSTGRES_PASSWORD:-}")"
"${SSH[@]}" bash -s <<REMOTE
set -euo pipefail
cd '${REMOTE_DIR}'
if [ ! -f .env ]; then
  dec() { printf '%s' "\$1" | base64 -d; }
  ADMIN_EMAIL_VAL="\$(dec '${REMOTE_ADMIN_EMAIL_B64}')"
  ADMIN_PASSWORD_VAL="\$(dec '${REMOTE_ADMIN_PASSWORD_B64}')"
  NEXTAUTH_SECRET_VAL="\$(dec '${REMOTE_NEXTAUTH_SECRET_B64}')"
  POSTGRES_PASSWORD_VAL="\$(dec '${REMOTE_POSTGRES_PASSWORD_B64}')"
  [ -n "\$NEXTAUTH_SECRET_VAL" ] || NEXTAUTH_SECRET_VAL="\$(openssl rand -base64 32)"
  [ -n "\$ADMIN_PASSWORD_VAL" ] || ADMIN_PASSWORD_VAL="\$(openssl rand -base64 18)"
  [ -n "\$POSTGRES_PASSWORD_VAL" ] || POSTGRES_PASSWORD_VAL="\$(openssl rand -base64 18)"
  umask 077
  python3 - "\$ADMIN_EMAIL_VAL" "\$ADMIN_PASSWORD_VAL" "\$NEXTAUTH_SECRET_VAL" "\$POSTGRES_PASSWORD_VAL" <<'PY'
import pathlib, sys
email, password, secret, pg = sys.argv[1:5]
pathlib.Path(".env").write_text(
    "POSTGRES_USER=kids\\n"
    f"POSTGRES_PASSWORD={pg}\\n"
    "POSTGRES_DB=kids_portfolio\\n"
    f"NEXTAUTH_SECRET={secret}\\n"
    "NEXTAUTH_URL=https://${DOMAIN}\\n"
    f"ADMIN_EMAIL={email}\\n"
    f"ADMIN_PASSWORD={password}\\n"
    "UPLOAD_DIR=/app/uploads\\n"
)
PY
  echo "Wrote ${REMOTE_DIR}/.env"
else
  echo "Keeping existing ${REMOTE_DIR}/.env"
fi
REMOTE

echo "==> Self-signed origin cert for Apache (Cloudflare Full, not Full Strict)"
"${SSH[@]}" bash -s <<REMOTE
set -euo pipefail
CRT=/etc/pki/tls/certs/${DOMAIN}.crt
KEY=/etc/pki/tls/private/${DOMAIN}.key
if [ ! -f "\$CRT" ] || [ ! -f "\$KEY" ]; then
  mkdir -p /etc/pki/tls/certs /etc/pki/tls/private
  openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
    -keyout "\$KEY" -out "\$CRT" \
    -subj "/CN=${DOMAIN}/O=GreedNews/C=HK"
  chmod 600 "\$KEY"
fi
install -m 644 '${REMOTE_DIR}/deploy/httpd-portfolio.conf' /etc/httpd/conf.d/${DOMAIN}.conf
apachectl configtest
systemctl reload httpd
REMOTE

echo "==> Build and start app + Postgres (loopback :3000)"
"${SSH[@]}" bash -s <<REMOTE
set -euo pipefail
cd '${REMOTE_DIR}'
docker compose -f docker-compose.yml -f docker-compose.behind-apache.yml up -d --build
for i in \$(seq 1 36); do
  if curl -fsS -o /dev/null http://127.0.0.1:3000/login; then
    echo "app is up"
    break
  fi
  sleep 5
done
curl -fsS -o /dev/null -w "local_app_http %{http_code}\\n" http://127.0.0.1:3000/login
# Seed once; ignore if admin already exists.
docker compose -f docker-compose.yml -f docker-compose.behind-apache.yml exec -T app \
  node_modules/.bin/prisma db seed || true
REMOTE

if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "==> Cloudflare DNS A ${DOMAIN} -> ${HOST} (proxied)"
  python3 - <<PY
import json, os, urllib.request
token = os.environ["CLOUDFLARE_API_TOKEN"]
host = os.environ["DEPLOY_HOST"]
domain = "${DOMAIN}"
zone_name = "greednews.com"

def cf(path, method="GET", body=None):
    req = urllib.request.Request(
        "https://api.cloudflare.com/client/v4" + path,
        data=None if body is None else json.dumps(body).encode(),
        method=method,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

zones = cf(f"/zones?name={zone_name}")["result"]
if not zones:
    raise SystemExit(f"Cloudflare zone {zone_name} not found for this token")
zid = zones[0]["id"]
existing = cf(f"/zones/{zid}/dns_records?name={domain}&type=A")["result"]
payload = {"type": "A", "name": "portfolio", "content": host, "proxied": True, "ttl": 1}
if existing:
    rec = existing[0]
    cf(f"/zones/{zid}/dns_records/{rec['id']}", "PUT", payload)
    print(f"updated A {domain} -> {host} proxied={payload['proxied']}")
else:
    cf(f"/zones/{zid}/dns_records", "POST", payload)
    print(f"created A {domain} -> {host} proxied")
PY
else
  echo "CLOUDFLARE_API_TOKEN not set — add an A record in Cloudflare:"
  echo "  Type A  Name portfolio  IPv4 ${HOST}  Proxy Proxied"
fi

echo "Done. After DNS propagates, open https://${DOMAIN}/login"
