# Artist of Sabko

Vite + React + Supabase starter for the Artist dashboard.

## Getting Started

1. npm ci
2. cp .env.example .env and set Supabase values
3. npm run dev

## Scripts

- dev: Vite dev server
- build: TypeScript build then Vite build
- preview: Vite preview
- typecheck: TypeScript project check
- lint: ESLint strict
- format: Prettier check

## CI/CD

- GitHub Actions runs lint, typecheck, prettier, and build on PRs and main.
- Vercel recommended for deploys: main → production, PRs → previews.
