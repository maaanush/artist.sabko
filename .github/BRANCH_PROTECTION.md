# Branch protection & environment gates

Configure in GitHub repo settings:

- Require PRs to main with at least 1 approval.
- Require status checks: CI (lint, typecheck, build, prettier) to pass before merge.
- Require branches to be up to date before merging.
- Disallow force pushes and deletions on main.
- Limit who can push to main (maintainers only).
- Require signed commits (optional).
- Vercel: restrict production deploys to main; use preview deploys on PRs.
