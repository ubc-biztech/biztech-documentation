---
title: CI/CD & Deployment Overview
nextjs:
  metadata:
    title: CI/CD & Deployment Overview
    description: How BizTech code gets built, tested, and deployed — environments, automated workflows, and what happens after a merge.
---

How code gets from a pull request to production across the frontend, backend, and documentation. {% .lead %}

---

## Environments

| Environment    | Frontend URL                     | Backend URL                          | Purpose                |
| -------------- | -------------------------------- | ------------------------------------ | ---------------------- |
| **Local**      | `http://localhost:3000`          | `http://localhost:4000`              | Development            |
| **Dev**        | `https://dev.app.ubcbiztech.com` | `https://api-dev.ubcbiztech.com`     | Testing new features   |
| **Production** | `https://app.ubcbiztech.com`     | `https://api.ubcbiztech.com`         | Live for all users     |

{% callout type="note" title="Dev and prod are separate" %}
Dev uses empty table suffixes. Production uses `"PROD"` suffixes. They share nothing — different DynamoDB tables, different Stripe keys, different Cognito pools. See [Environment & Config](/docs/guides/environment) for details.
{% /callout %}

---

## Pipeline at a glance

```
Developer pushes code
        │
        ├─ Pull Request opened
        │   ├─ Backend: sls package check (dev), eslint autofix
        │   ├─ Frontend: npm build + test, Prettier autofix
        │   └─ Vercel: preview deployment created
        │
        ├─ Merge to dev (backend) / main (frontend)
        │   ├─ Backend: sls deploy --stage dev (all 21 services)
        │   ├─ Frontend: Vercel production deploy
        │   └─ Backend autofix + frontend autofix run again
        │
        ├─ Merge to master (backend)
        │   └─ Backend: sls deploy --stage prod (all 21 services)
        │
        ├─ GitHub Release published (backend)
        │   └─ Deploy Prod workflow: sls deploy --stage prod
        │
        └─ Docs push to main
            └─ Triggers backend redeploy with rebuilt Slack bot index
```

---

## What runs when — quick reference

### On pull requests

- **Backend CI Test** — packages all 21 services with `sls package --stage dev` in parallel to verify deployability
- **Backend autofix** — runs `eslint --fix` and auto-commits formatting changes
- **Frontend Node.js CI** — runs `npm ci`, `npm run build`, `npm test`
- **Frontend autofix** — runs `prettier --write` and auto-commits formatting changes
- **Vercel** — builds a preview deployment with a unique URL

### On merge to dev (backend)

- **Deploy on merge** workflow deploys all 21 services to `--stage dev` sequentially

### On merge to main (frontend)

- **Vercel** deploys to production automatically
- **Node.js CI** and **autofix** run again on the push

### On merge to master (backend)

- **Deploy on merge** workflow deploys all 21 services to `--stage prod` sequentially
- **CI Test** also runs the `sls package --stage prod` check

### On GitHub Release published (backend)

- **Deploy Prod** workflow deploys all 21 services to `--stage prod` (separate workflow from merge-based deploy)

### On docs push to main

- **Trigger Bot Update** sends a `repository_dispatch` event to the backend repo
- Backend **Deploy on merge** workflow catches it, rebuilds the Slack bot docs index, and redeploys dev

---

## Workflow files summary

### Backend — serverless-biztechapp

| File | Name | Triggers |
| ---- | ---- | -------- |
| `.github/workflows/deploy.yml` | Deploy on merge | Push to `dev`/`master`, `repository_dispatch` |
| `.github/workflows/deploy-prod.yml` | Deploy Prod | GitHub Release published |
| `.github/workflows/test.yml` | CI Test | Pull requests, push to `dev`/`master` |
| `.github/workflows/lint.yml` | autofix.ci | Pull requests, push to `dev`/`master` |

### Frontend — bt-web-v2

| File | Name | Triggers |
| ---- | ---- | -------- |
| `.github/workflows/node.js.yml` | Node.js CI | Push to `main`/`dev`, PRs targeting `main` |
| `.github/workflows/prettier.yml` | autofix.ci | Pull requests, push to `main`/`dev` |

### Documentation — biztech-documentation

| File | Name | Triggers |
| ---- | ---- | -------- |
| `.github/workflows/trigger-bot-update.yml` | Trigger Bot Update | Push to `main`, manual dispatch |

---

## Monitoring and logs

### Frontend (Vercel)

- **Vercel Dashboard** → Deployments tab for build logs and runtime logs
- **Vercel Analytics** for performance monitoring (via `@vercel/analytics`)
- **Vercel Speed Insights** for Core Web Vitals (via `@vercel/speed-insights`)

### Backend (AWS)

- **CloudWatch Logs** — each Lambda function writes to its own log group
- **API Gateway** — request/response logs in CloudWatch
- **DynamoDB** — table metrics in the AWS Console

```bash
# View logs for a specific function
npx sls logs --function eventsGet --stage prod
```

---

## Rollback

### Frontend

Vercel keeps all previous deployments. To rollback: go to Vercel Dashboard → Deployments, find the last working deployment, click "..." → "Promote to Production."

### Backend

Revert the Git commit and push — the deploy workflow will redeploy:

```bash
git revert HEAD
git push origin dev
```

Each deployment also creates a CloudFormation stack that can be rolled back in the AWS Console.

---

## Related pages

- [Backend Workflows](/docs/cicd/backend-workflows) — detailed backend CI/CD documentation
- [Frontend Workflows](/docs/cicd/frontend-workflows) — frontend CI, Vercel, and formatting
- [Docs & Bot Sync](/docs/cicd/docs-sync) — cross-repo docs index pipeline
- [Environment & Config](/docs/guides/environment) — stage variables and configuration
- [Local Dev & Debugging](/docs/guides/debugging) — running the stack locally
- [Testing](/docs/guides/testing) — unit and integration tests
