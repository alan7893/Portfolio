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

## Optional AI (Gemini)

Copy `.env.example` to `.env.local` and set:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

With Gemini configured:
- Uploaded photos are analyzed by **Gemini 2.5 Flash**
- Portfolio reports are AI-written in a **4–8 page** narrative style
- Token-safe mode uses stored summaries (top 12 photos + top 20 records), not every raw image on each report

Without a key, Lumen still works with local analysis + rule-based reports.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm start` — run production server
- `npm run lint` — ESLint
