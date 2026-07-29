# Lumen (Portfolio) — agent notes

## Cursor Cloud specific instructions

### Stack

Next.js App Router (React 19) + TypeScript + Tailwind v4. Product name: **Lumen** — multi-person memory system with photo analysis and portfolio reports.

### Tooling

- Node.js 22 (see `.nvmrc`), npm
- Dev server: `npm run dev` on port **3000**
- Install: `npm ci` (or `npm install`)

### Verify changes

```bash
npm run lint
npm run build
```

### Data

Local JSON store at `data/store.json` and uploads under `data/uploads` + `public/uploads`. These are gitignored except `.gitkeep`.

### Optional secrets

- `OPENAI_API_KEY` — richer photo vision via OpenAI; without it, local palette/mood analysis still runs

### Design

Brand-first **Lumen** header, Syne + Manrope, deep ink/sea/ember palette, atmospheric gradients, restrained motion (`animate-rise`, brand shimmer). Avoid purple-default and cream/terracotta clichés.
