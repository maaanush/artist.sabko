# Contributing

## Prerequisites

- Node 20+
- npm 10+

## Setup

- npm ci
- Copy `.env.example` to `.env` and fill values.

## Commands

- npm run dev — start Vite dev server
- npm run lint — ESLint with strict rules
- npm run typecheck — TypeScript project check
- npm run build — TypeScript build + Vite build
- npm run preview — Vite preview

## Workflow

- Create feature branches.
- Ensure pre-commit passes (lint-staged + typecheck).
- Open PR; CI must pass before merge.
