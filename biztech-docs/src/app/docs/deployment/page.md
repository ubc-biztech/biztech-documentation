---
title: Deployment Guide
nextjs:
  metadata:
    title: Deployment Guide
    description: How to deploy the BizTech frontend and backend, covering environments, CI/CD, Vercel, Serverless Framework, and custom domains.
---

How to deploy changes to dev, staging, and production for both the frontend (Vercel) and backend (Serverless Framework on AWS). {% .lead %}

---

## Environment Overview

| Environment    | Frontend URL                     | Backend URL                          | Purpose                |
| -------------- | -------------------------------- | ------------------------------------ | ---------------------- |
| **Local**      | `http://localhost:3000`          | `http://localhost:4000`              | Development            |
| **Dev**        | `https://dev.app.ubcbiztech.com` | `https://api-dev.ubcbiztech.com`     | Testing new features   |
| **Staging**    | `https://dev.v2.ubcbiztech.com`  | `https://api-staging.ubcbiztech.com` | Pre-production testing |
| **Production** | `https://app.ubcbiztech.com`     | `https://api.ubcbiztech.com`         | Live for all users     |

---

## Frontend Deployment (Vercel)

The frontend (`bt-web-v2`) is deployed on **Vercel** with automatic deployments from Git.

### How It Works

1. Push code to a branch on GitHub
2. Vercel automatically builds and creates a **preview deployment** for every branch/PR
3. Merging to `main` triggers a **production deployment**
4. Merging to `dev` triggers a **dev/staging deployment**

### Vercel Configuration

| Setting          | Value           |
| ---------------- | --------------- |
| Framework        | Next.js         |
| Build Command    | `npm run build` |
| Output Directory | `.next`         |
| Node.js Version  | 20.x            |
| Root Directory   | `/`             |

### Environment Variables on Vercel

These are set in the Vercel dashboard (Settings → Environment Variables):

| Variable                      | Dev                                           | Production   |
| ----------------------------- | --------------------------------------------- | ------------ |
| `NEXT_PUBLIC_REACT_APP_STAGE` | _(omit or set to any non-`production` value)_ | `production` |

{% callout type="warning" title="Don't Commit .env Files" %}
Environment variables for Vercel are set in the Vercel dashboard, not in the repository. Never commit `.env` or `.env.local` files.
{% /callout %}

### Preview Deployments

Every pull request gets its own preview URL (e.g., `bt-web-v2-abc123.vercel.app`). Use these to test your changes before merging.

### Custom Domains

| Domain                   | Points To             |
| ------------------------ | --------------------- |
| `app.ubcbiztech.com`     | Production deployment |
| `dev.app.ubcbiztech.com` | Dev branch deployment |
| `v2.ubcbiztech.com`      | Production alias      |

---

## Backend Deployment (Serverless Framework)

The backend (`serverless-biztechapp-1`) is deployed using the **Serverless Framework** to AWS Lambda and API Gateway.

### Deploying a Single Service

```bash
cd services/events
npx sls deploy --stage dev
```

### Deploying All Services

Use the multi-gateway config to deploy everything:

```bash
npx sls deploy --stage dev    # Deploy to dev
npx sls deploy --stage prod   # Deploy to production
```

Or deploy services individually in the correct order:

```bash
# hello MUST be deployed first (exports shared API Gateway)
cd services/hello && npx sls deploy --stage dev
cd services/events && npx sls deploy --stage dev
cd services/registrations && npx sls deploy --stage dev
# ... and so on for each service
```

{% callout type="warning" title="Deploy Order Matters" %}
The `hello` service must be deployed **first** because it creates the shared API Gateway and Cognito Authorizer that all other services import. If you deploy another service before `hello`, it will fail with a CloudFormation import error.
{% /callout %}

### Deployment Stages

| Stage     | Config File           | ENVIRONMENT | Table Suffix |
| --------- | --------------------- | ----------- | ------------ |
| `dev`     | `config.dev.json`     | `""`        | None         |
| `staging` | `config.staging.json` | `""`        | None         |
| `prod`    | `config.prod.json`    | `"PROD"`    | `PROD`       |

### Custom Domains (Serverless Domain Manager)

Backend custom domains are managed by the `serverless-domain-manager` plugin:

```yaml
# In serverless.common.yml
customDomain:
  domainName: api-${sls:stage}.ubcbiztech.com
  basePath: ''
  stage: ${sls:stage}
```

---

## Deployment Checklist

### Before Deploying to Production

1. **Test locally**: Run both frontend and backend locally, test the feature end-to-end
2. **Test on dev**: Deploy to dev, test on `dev.app.ubcbiztech.com`
3. **Create a PR**: Get code review from at least one other developer
4. **Check for breaking changes**: Database schema changes, API contract changes
5. **Check environment variables**: New env vars need to be added to Vercel / AWS
6. **Deploy backend first**: If both frontend and backend changed, deploy backend before frontend to avoid the frontend calling endpoints that don't exist yet

### After Deploying to Production

1. **Smoke test**: Visit `app.ubcbiztech.com` and test critical flows (login, registration, admin)
2. **Check logs**: Monitor CloudWatch logs for Lambda errors
3. **Monitor Vercel**: Check Vercel dashboard for build errors or runtime issues

---

## Monitoring & Logs

### Frontend (Vercel)

- **Vercel Dashboard** → Deployments tab: build logs, runtime logs
- **Vercel Analytics** for automatic performance monitoring (enabled via `@vercel/analytics`)
- **Vercel Speed Insights** for Core Web Vitals (enabled via `@vercel/speed-insights`)

### Backend (AWS)

- **CloudWatch Logs**: Each Lambda function writes to its own log group
  ```bash
  # View logs for events service
  npx sls logs --function eventsGet --stage prod
  ```
- **API Gateway**: Request/response logs in CloudWatch
- **DynamoDB**: Table metrics in the AWS Console (read/write capacity, throttled requests)

### Useful AWS Console Links

| Service     | What to Check                              |
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

### Frontend (Vercel)

Vercel keeps all previous deployments. To rollback:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

### Backend (Serverless)

Serverless Framework doesn't have built-in rollback, but you can:

1. **Revert the Git commit** and redeploy:

   ```bash
   git revert HEAD
   npx sls deploy --stage prod
   ```

2. **Use CloudFormation**: Each deployment creates a CloudFormation stack. You can rollback in the AWS Console.

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
