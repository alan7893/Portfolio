#!/bin/sh
set -e
mkdir -p /app/uploads
if id nextjs >/dev/null 2>&1; then
  chown -R nextjs:nodejs /app/uploads || true
  exec runuser -u nextjs -- sh -c 'node node_modules/prisma/build/index.js migrate deploy && exec node server.js'
fi
exec sh -c 'node node_modules/prisma/build/index.js migrate deploy && exec node server.js'
