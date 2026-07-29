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

- `GEMINI_API_KEY` — preferred. Enables Gemini 2.5 Flash for photo understanding + 4–8 page AI reports
- `GEMINI_MODEL` — defaults to `gemini-2.5-flash`
- `OPENAI_API_KEY` — optional vision fallback if Gemini is unavailable

Report generation uses **token-safe mode**: only the top 12 photo summaries and top 20 track records are sent to the model (not every raw image each time).

### Design

Brand-first **Lumen** header, Syne + Manrope, deep ink/sea/ember palette, atmospheric gradients, restrained motion (`animate-rise`, brand shimmer). Avoid purple-default and cream/terracotta clichés.
