---
title: Frontend Workflows
nextjs:
  metadata:
    title: Frontend Workflows
    description: GitHub Actions workflows and Vercel deployment for the frontend — Node.js CI, Prettier autofix, preview deployments, and production releases.
---

The frontend repo (`bt-web-v2`) uses two GitHub Actions workflows for CI and formatting, plus Vercel for automatic deployment. {% .lead %}

All workflow files live in `.github/workflows/` in the frontend repo.

---

## Node.js CI

**File:** `.github/workflows/node.js.yml`

**Triggers:**

- Push to `main` or `dev`
- Pull requests targeting `main`

Runs a clean install, build, and test on Node.js 20.x:

```bash
npm ci --if-present
npm run build --if-present
npm run build --if-present
npm test --if-present
```

The `--if-present` flags mean each step is skipped if the corresponding script doesn't exist in `package.json`. Currently the frontend defines `build` (`next build`) but not `test`, so the test step is a no-op.

This workflow catches build failures before merge — if `next build` fails (TypeScript errors, missing imports, etc.), the PR check fails.

---

## autofix.ci (Prettier)

**File:** `.github/workflows/prettier.yml`

**Triggers:**

- All pull requests
- Push to `main` or `dev`

Runs Prettier on the entire codebase and auto-commits formatting changes:

```bash
npx prettier . --write
```

Uses the [autofix-ci/action](https://github.com/autofix-ci/action) to push a commit with the message `"Formatting with Prettier"` if any files changed.

This means:

- On a PR branch, you may see an extra commit appear with formatting fixes after pushing
- You don't need to run Prettier manually before pushing, but it's faster to run it locally

---

## Vercel deployment

The frontend is deployed on **Vercel** with automatic Git integration. There is no GitHub Actions workflow for Vercel — it's configured directly in the Vercel dashboard.

### How deployments work

- **Every push** to any branch creates a preview deployment with a unique URL
- **Merge to `main`** triggers a production deployment to `app.ubcbiztech.com`
- **Merge to `dev`** triggers a deployment to `dev.app.ubcbiztech.com`

### Vercel configuration

| Setting          | Value           |
| ---------------- | --------------- |
| Framework        | Next.js         |
| Build command    | `npm run build` |
| Output directory | `.next`         |
| Node.js version  | 20.x            |

### Environment variables

Set in the Vercel dashboard (Settings → Environment Variables), not in the repository:

| Variable                      | Dev                        | Production   |
| ----------------------------- | -------------------------- | ------------ |
| `NEXT_PUBLIC_REACT_APP_STAGE` | _(omit or non-production)_ | `production` |

The `NEXT_PUBLIC_REACT_APP_STAGE` variable controls which backend API URL the frontend talks to. When set to `production`, it uses `api.ubcbiztech.com`; otherwise it uses `api-dev.ubcbiztech.com`.

{% callout type="warning" title="Do not commit .env files" %}
Environment variables for Vercel are set in the Vercel dashboard. Never commit `.env` or `.env.local` files to the repository.
{% /callout %}

### Preview deployments

Every pull request gets a preview URL like `bt-web-v2-abc123.vercel.app`. Use these to test your changes before merging. Preview deployments use dev environment variables.

### Custom domains

| Domain                   | Points to           |
| ------------------------ | ------------------- |
| `app.ubcbiztech.com`     | Production (`main`) |
| `dev.app.ubcbiztech.com` | Dev branch          |
| `v2.ubcbiztech.com`      | Production alias    |

---

## Frontend vs backend CI comparison

| Aspect               | Frontend                     | Backend                                        |
| -------------------- | ---------------------------- | ---------------------------------------------- |
| Build check          | `next build`                 | `sls package --stage dev`                      |
| Formatter            | Prettier (autofix)           | ESLint (autofix)                               |
| Deploy target        | Vercel                       | AWS Lambda via Serverless                      |
| Deploy trigger       | Vercel Git integration       | GitHub Actions workflow                        |
| Test runner          | `npm test` (currently no-op) | `npm run utest` / `npm run itest` (local only) |
| Preview environments | Vercel preview per branch    | None (dev stage only)                          |

---

## What to expect after merging

### PR merged to main

1. Vercel builds and deploys to production (~1-2 min)
2. Node.js CI runs build check
3. Prettier autofix runs (may push a formatting commit)
4. Site is live at `app.ubcbiztech.com`

### PR merged to dev

1. Vercel deploys to `dev.app.ubcbiztech.com`
2. Node.js CI runs on the push
3. Prettier autofix runs

---

## Debugging a failed build

1. **Check the Vercel dashboard** — Deployments tab shows build logs with the exact error
2. **Check GitHub Actions** — the Node.js CI workflow shows `next build` output
3. **Common failures:**
   - TypeScript errors — fix the type error locally and push
   - Missing dependencies — check `package.json` and run `npm ci` locally
   - Environment variable issues — check the Vercel dashboard settings

To test locally:

```bash
npm run build
```

If this succeeds locally, the CI build should also succeed.

---

## Key files

| File                             | Purpose                                  |
| -------------------------------- | ---------------------------------------- |
| `.github/workflows/node.js.yml`  | Build and test check                     |
| `.github/workflows/prettier.yml` | Prettier autofix                         |
| `package.json`                   | Scripts: `dev`, `build`, `start`, `lint` |

---

## Related pages

- [CI/CD Overview](/docs/cicd) — high-level pipeline summary
- [Backend Workflows](/docs/cicd/backend-workflows) — Serverless deployment and ESLint
- [Docs & Bot Sync](/docs/cicd/docs-sync) — cross-repo docs index pipeline
- [Frontend Architecture](/docs/frontend-architecture) — code structure and patterns
- [Styling & Configuration](/docs/frontend-architecture/styling) — Tailwind, Prettier config
