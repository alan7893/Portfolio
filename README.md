# 兒童成長紀錄 · Kids Portfolio

家庭專用嘅小朋友成長紀錄同作品集網站。記錄相片、獎項、比賽、日程同里程碑；日後會加入 AI 自動生成作品集／推薦信／回憶檔案（Phase 2）。

A private family website to record a child's life events (photos, prizes, competitions, schedules, milestones). **Traditional Chinese (Hong Kong / Cantonese) is the base UI language**, with an English toggle.

- Production domain: `portfolio.greednews.com`
- Deploy target: DigitalOcean. Dedicated Ubuntu 24.04 + Caddy is the clean setup; the existing `greednews.com` CentOS droplet can host it **behind Apache** so WordPress keeps ports 80/443.

## Tech stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL 16 + Prisma ORM
- NextAuth.js (email/password credentials, single family admin)
- Zod validation, authenticated file serving, in-memory login rate limiting

## Features (Phase 1)

- 家長登入（email／密碼），除 `/login` 外全部頁面需要登入
- 概覽 Dashboard：事件總數、本月事件、即將發生、最新 6 張相
- 事件 CRUD：按類型顯示動態欄位（例如 PRIZE 先顯示名次），列表可按小朋友／類型／年份／標籤篩選 + 分頁
- 多檔案上載（拖放 + 揀選），JPEG／PNG／WebP／MP4／PDF，每檔上限 25MB，只經已驗證嘅 API route 串流
- 時間軸 Timeline：由新到舊，按年／月分組，分類 Tabs
- zh-HK ⇆ en 語言切換

## Local development

Requires Node.js 22 and a PostgreSQL 16 you can reach.

### Option A — Postgres via Docker, app via npm (recommended for dev)

```bash
# 1. Start only the database
docker compose up -d db
#    (or run your own Postgres and point DATABASE_URL at it)

# 2. Configure env
cp .env.example .env
#    Edit .env — for the compose db, use:
#    DATABASE_URL="postgresql://kids:kids_dev_pw@127.0.0.1:5432/kids_portfolio?schema=public"
#    (uncomment the 127.0.0.1 ports mapping in docker-compose.yml for local access)

# 3. Install, migrate, seed
npm install
npm run prisma:migrate       # applies migrations (dev)
npm run db:seed              # 1 admin + 1 child + 8 sample events

# 4. Run the dev server
npm run dev                  # http://localhost:3000
```

Sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.

### Option B — everything in Docker

```bash
cp .env.example .env         # set NEXTAUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d --build
docker compose exec app node_modules/.bin/prisma db seed   # optional sample data
```

## Production deploy (DigitalOcean Droplet)

### Option A — sit behind the existing greednews.com Apache droplet

This is the path that does **not** steal `:80`/`:443` from WordPress. Docker publishes the app on `127.0.0.1:3000` only; Apache vhosts `portfolio.greednews.com`.

From a machine that can SSH to the droplet (`DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_SSH_PRIVATE_KEY`):

```bash
export ADMIN_EMAIL='you@example.com'
export ADMIN_PASSWORD='choose-a-strong-password'
# optional: export CLOUDFLARE_API_TOKEN='...'  # Zone.DNS Edit, creates the A record
./scripts/go-live.sh
```

Cloudflare DNS if you are adding it by hand: `A portfolio → <droplet IPv4>`, proxied. SSL/TLS mode **Full** (not Full Strict) until an Origin Certificate is installed.

### Option B — dedicated Ubuntu 24.04 droplet with Caddy

```bash
# On the droplet (Ubuntu 24.04, Docker + compose plugin installed):
git clone <your-repo-url> kids-portfolio && cd kids-portfolio

# 1. Secrets
cp .env.example .env
#    Set a strong NEXTAUTH_SECRET (openssl rand -base64 32),
#    NEXTAUTH_URL=https://portfolio.greednews.com, ADMIN_EMAIL, ADMIN_PASSWORD,
#    and POSTGRES_PASSWORD.

# 2. Cloudflare Origin Certificate (Full strict)
#    Create an Origin Certificate in the Cloudflare dashboard and save:
mkdir -p caddy/certs
#      caddy/certs/origin.pem   (certificate)
#      caddy/certs/origin.key   (private key)

# 3. DNS: add an A record for portfolio.greednews.com -> droplet IP,
#    proxied (orange cloud), SSL/TLS mode = Full (strict).

# 4. Launch
docker compose up -d --build
#    The app container runs `prisma migrate deploy` on start.

# 5. Seed the first admin + sample child (once)
docker compose exec app node_modules/.bin/prisma db seed
```

Postgres is **not** published to the host — only the app reaches it over the
internal Docker network. Uploads persist in the `uploads` named volume.

### Backups (pg_dump cron example)

```bash
# /etc/cron.d/kids-portfolio-backup — nightly at 03:15
15 3 * * * root cd /root/kids-portfolio && \
  docker compose exec -T db pg_dump -U kids kids_portfolio \
  | gzip > /root/backups/kids_$(date +\%Y\%m\%d).sql.gz
```

Restore: `gunzip -c backup.sql.gz | docker compose exec -T db psql -U kids -d kids_portfolio`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth JWT signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Public base URL |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded parent admin account |
| `UPLOAD_DIR` | Where uploads are written (container: `/app/uploads`) |

## AI generation (Phase 2 — not built yet)

`POST /api/ai/generate` is an intentional stub returning **501 Not Implemented**.
Phase 2 will generate portfolios / testimonials / memory files from a child's
events, media and tags.

## Scripts

- `npm run dev` — dev server
- `npm run build` — `prisma generate` + production build (standalone)
- `npm start` — run the production server
- `npm run lint` — ESLint
- `npm run prisma:migrate` / `prisma:deploy` — migrations (dev / prod)
- `npm run db:seed` — seed admin + child + sample events
