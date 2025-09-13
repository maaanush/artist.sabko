# Artist of Sabko

## Environment setup

1. Copy `env.example` to `.env` and fill values.
2. Install deps: `npm install`
3. Run the app: `npm run dev`

### Required variables

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Edge Functions: `PROJECT_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, optional `APP_ORIGIN`
- EmailJS (optional): `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_SECRET`
- Admin bootstrap: `SUPABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

## Supabase function secrets

After `.env` is set, run:

```bash
npm run sb:secrets
```

Deploy functions:

```bash
npm run sb:deploy:functions
```

## Secret rotation playbook (Service Role exposure)

1. Regenerate the Service Role key in Supabase Dashboard → Settings → API.
2. Update local `.env` and re-run `npm run sb:secrets`.
3. Redeploy functions: `npm run sb:deploy:functions`.
4. Rewrite Git history to purge the leaked value (BFG or git-filter-repo).
   - BFG example:
     - `brew install bfg`
     - Create `replacements.txt` containing the exact leaked key
     - `bfg --replace-text replacements.txt`
     - `git push --force --prune origin main`
5. Review Supabase logs for suspicious activity.

## Notes

- Never use `SERVICE_ROLE_KEY` in frontend code.
- `.env*` files are git-ignored; only commit `env.example`.
