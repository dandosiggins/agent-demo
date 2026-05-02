# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Agentic AI Demo (`artifacts/agent-demo`, preview path: `/`)
A fully frontend-only React + Vite web app demonstrating how agentic AI works. Features:
- **Landing page** — hero, 4 scenario cards, custom goal input, 6-phase explainer
- **Demo page** — animated agent loop: typewriter thought stream, tool call cards (web search / memory / code interpreter / calculator / file read), execution trace sidebar, framer-motion animations
- **Results page** — formatted final answer, step summary, elapsed time
- No backend, no database, no real AI calls — all scenarios are scripted simulations

Key files:
- `artifacts/agent-demo/src/data/scenarios.ts` — 4 scripted scenarios (Tokyo trip, fusion energy, API debug, startup pitch)
- `artifacts/agent-demo/src/engine/simulation.ts` — pure reducer-based simulation state machine
- `artifacts/agent-demo/src/context/simulation.tsx` — React context for simulation state
- `artifacts/agent-demo/src/pages/home.tsx` — landing page
- `artifacts/agent-demo/src/pages/demo.tsx` — main simulation page
- `artifacts/agent-demo/src/pages/results.tsx` — results page

### API Server (`artifacts/api-server`, preview path: `/api`)
Express 5 backend server. Currently serves a health check endpoint.

### Canvas (`artifacts/mockup-sandbox`, preview path: `/__mockup`)
Mockup sandbox for UI prototyping.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
