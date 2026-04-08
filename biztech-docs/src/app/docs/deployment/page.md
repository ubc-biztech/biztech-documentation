---
title: Deployment Guide
nextjs:
  metadata:
    title: Deployment Guide
    description: Deployment checklist and manual deployment procedures for the BizTech frontend and backend.
---

Deployment checklist and manual deployment procedures. For automated CI/CD workflows, see the [CI/CD & Deployment](/docs/cicd) section. {% .lead %}

---

## Deployment checklist

### Before deploying to production

1. **Test locally** — run both frontend and backend locally, test the feature end-to-end
2. **Test on dev** — deploy to dev, test on `dev.app.ubcbiztech.com`
3. **Create a PR** — get code review from at least one other developer
4. **Check CI** — make sure the packaging check and build pass (see [Backend Workflows](/docs/cicd/backend-workflows) and [Frontend Workflows](/docs/cicd/frontend-workflows))
5. **Check for breaking changes** — database schema changes, API contract changes
6. **Check environment variables** — new env vars need to be added to Vercel dashboard or GitHub Actions secrets
7. **Deploy backend first** — if both frontend and backend changed, deploy backend before frontend to avoid the frontend calling endpoints that don't exist yet

### After deploying to production

1. **Smoke test** — visit `app.ubcbiztech.com` and test critical flows (login, registration, admin)
2. **Check logs** — monitor CloudWatch logs for Lambda errors
3. **Monitor Vercel** — check Vercel dashboard for build errors or runtime issues

---

## Manual backend deployment

To deploy a single service:

```bash
cd services/events
npx sls deploy --stage dev
```

To deploy all services:

```bash
cd services
for DIR in *; do
  cd "$DIR"
  npx sls deploy --stage dev
  cd ..
done
```

{% callout type="warning" title="Deploy order" %}
The `hello` service must be deployed **first** because it creates the shared API Gateway and Cognito Authorizer that all other services import. If you deploy another service before `hello`, it will fail with a CloudFormation import error.
{% /callout %}

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

### AWS Console reference

| Service     | What to check                              |
| ----------- | ------------------------------------------ |
| Lambda      | Function invocations, errors, duration     |
| API Gateway | Request count, 4xx/5xx errors              |
| DynamoDB    | Table size, read/write capacity, throttles |
| CloudWatch  | Logs, alarms, metrics                      |
| Cognito     | User pool size, sign-in activity           |
| S3          | Storage usage for images                   |
| SES         | Email sending stats, bounces               |

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

- [CI/CD Overview](/docs/cicd) — environments, automated workflows, pipeline summary
- [Backend Workflows](/docs/cicd/backend-workflows) — what deploys on merge, release, and PR
- [Frontend Workflows](/docs/cicd/frontend-workflows) — Vercel, Node.js CI, Prettier
- [Environment & Config](/docs/guides/environment) — stage variables and configuration

---

## Infrastructure as Code

### Frontend Infrastructure

| What           | Managed By    | Where                |
| -------------- | ------------- | -------------------- |
| Hosting        | Vercel        | Vercel dashboard     |
| Auth (Cognito) | Amplify Gen 2 | `amplify/` directory |
| Domain (DNS)   | -             | DNS provider         |

### Backend Infrastructure

| What             | Managed By                | Where                       |
| ---------------- | ------------------------- | --------------------------- |
| Lambda functions | Serverless Framework      | `services/*/serverless.yml` |
| API Gateway      | Serverless Framework      | Created by `hello` service  |
| DynamoDB tables  | Manual / Scripts          | AWS Console (not in IaC)    |
| S3 buckets       | Manual                    | AWS Console                 |
| Cognito          | Amplify Gen 2             | `amplify/auth/resource.ts`  |
| SES              | Manual                    | AWS Console                 |
| Custom domains   | Serverless Domain Manager | `serverless.common.yml`     |

{% callout type="warning" title="DynamoDB Tables Are Not in IaC" %}
DynamoDB tables are currently created manually in the AWS Console, not through CloudFormation or Serverless. Be very careful when modifying table schemas because there is no automated way to rollback table changes.
{% /callout %}

---

## Adding New Environment Variables

### Frontend (Vercel)

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add the variable for the appropriate environments (Production, Preview, Development)
3. Redeploy for the change to take effect

### Backend (AWS Lambda)

Add the variable to `serverless.common.yml` under `provider.environment`:

```yaml
provider:
  environment:
    MY_NEW_VAR: ${env:MY_NEW_VAR}
```

Then set the value:

- **Locally:** Add to your `.env` file
- **Deployed:** Set in your CI/CD pipeline or as an SSM parameter
