#!/usr/bin/env bash
# Idempotent local-dev bootstrap for the Kids Portfolio app.
# Installs deps, ensures a local Postgres 16 + database exist, applies
# migrations and seeds sample data. Safe to run repeatedly.
set -euo pipefail

cd "$(dirname "$0")/.."

DB_USER="kids"
DB_PASS="kids_dev_pw"
DB_NAME="kids_portfolio"

echo "▸ Ensuring .env exists"
if [ ! -f .env ]; then
  cp .env.example .env
fi

echo "▸ Installing npm dependencies"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

if command -v sudo >/dev/null 2>&1; then
  if ! command -v psql >/dev/null 2>&1; then
    echo "▸ Installing PostgreSQL 16"
    sudo apt-get update -qq
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib
  fi

  echo "▸ Starting PostgreSQL cluster"
  sudo pg_ctlcluster 16 main start 2>/dev/null || true

  echo "▸ Ensuring role and database"
  sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}' CREATEDB;"
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
else
  echo "▸ sudo unavailable — assuming DATABASE_URL points at an existing Postgres"
fi

echo "▸ Applying migrations"
npx prisma migrate deploy

echo "▸ Seeding sample data"
npm run db:seed || true

echo "✓ Dev environment ready — run: npm run dev"
