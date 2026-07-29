# Portfolio — agent notes

## Cursor Cloud specific instructions

### Stack

This repo is a personal portfolio site. Prefer a modern Node.js frontend (Next.js App Router or Vite + React) unless the existing code already uses something else.

### Tooling already on the VM

- Node.js 22 (nvm), npm, pnpm, yarn
- TypeScript, ESLint, Prettier, `create-next-app` (global npm packages via nvm)
- Google Chrome (for browser / visual checks)

### Install / run

- Dependencies: `npm install` (or `pnpm install` / `yarn` if those lockfiles exist)
- Dev server: typically `npm run dev` on port **3000** (Vite projects often use **5173**)
- Lint / typecheck / build before finishing UI work when those scripts exist

### Design

Follow the repo’s frontend design rules when building or redesigning pages: brand-first hero, expressive typography, atmospheric backgrounds, full-bleed hero imagery, no card clutter in the hero, and intentional motion.
