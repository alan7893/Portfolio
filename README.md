# Lumen — Memory Portfolio

Personal memory system: upload photos, log a person’s track record, switch between people, and generate a portfolio report with **activity**, **positive feedback**, and **sparkling hours**.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Multi-user profiles** — create people and switch between them
- **Photo memories** — upload images; Lumen analyzes content (OpenAI vision when `OPENAI_API_KEY` is set, otherwise local visual analysis)
- **Track records** — dated notes with category + sparkle intensity
- **Portfolio report** — activity themes, strengths, and pinpointed sparkling hours

## Optional AI vision

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` for richer photo understanding.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm start` — run production server
- `npm run lint` — ESLint
