---
title: Backend Workflows
nextjs:
  metadata:
    title: Backend Workflows
    description: GitHub Actions workflows for the backend — deploy on merge, deploy on release, CI packaging checks, and ESLint autofix.
---

The backend repo (`serverless-biztechapp`) has four GitHub Actions workflows that handle deployment, validation, and formatting. {% .lead %}

All workflow files live in `.github/workflows/` in the backend repo.

---

## Deploy on merge

**File:** `.github/workflows/deploy.yml`

**Triggers:**

- Push to `dev` branch
- Push to `master` branch
- `repository_dispatch` with type `biztech_docs_updated` (from the docs repo)

This is the primary deployment workflow. It loops through all 21 service directories under `services/` and runs `sls deploy` on each one sequentially.

### Dev deployment

Runs when code is pushed to `dev`, or when a `repository_dispatch` event arrives from the docs repo.

```bash
cd services
for DIR in *; do
  cd "$DIR"
  sls deploy --conceal --stage dev
  cd ..
done
```

The `--conceal` flag hides secret environment variable values from the Actions log output.

### Production deployment

Runs when code is pushed to `master`:

```bash
cd services
for DIR in *; do
  cd "$DIR"
  sls deploy --conceal --stage prod
  cd ..
done
```

### Docs index rebuild

When triggered by `repository_dispatch` (type `biztech_docs_updated`), the workflow also:

1. Checks out the docs repo at the commit SHA that triggered the dispatch
2. Runs `npm run build:slack-docs-index -- --docs-root ./biztech-documentation/biztech-docs/src/app`
3. Verifies the output file exists at `services/bots/docsIndex.js`
4. Deploys all services to dev (which includes the bots service with the updated index)

See [Docs & Bot Sync](/docs/cicd/docs-sync) for the full cross-repo flow.

### What the deploy loop actually does

Each service directory contains its own `serverless.yml`. The Serverless Framework:

1. Reads the service config + shared config from `serverless.common.yml`
2. Bundles the handler code with `serverless-esbuild`
3. Creates/updates a CloudFormation stack on AWS
4. Deploys Lambda functions, API Gateway routes, and IAM roles
5. Connects to the shared API Gateway exported by the `hello` service

{% callout type="warning" title="Deploy order" %}
The `hello` service must exist before other services can deploy, because it creates the shared API Gateway and Cognito Authorizer that all other services import via CloudFormation. In the automated workflow, this works because `hello` comes first alphabetically when the loop iterates through `services/*`. If you deploy manually, deploy `hello` first.
{% /callout %}

---

## Deploy Prod (release)

**File:** `.github/workflows/deploy-prod.yml`

**Trigger:** GitHub Release published

This is a separate prod deployment workflow that runs when a GitHub Release is created. It does the same thing as the `master` branch path in `deploy.yml` — deploys all 21 services to `--stage prod`.

```bash
cd services
for DIR in *; do
  cd "$DIR"
  npx sls deploy --stage prod --conceal
  cd ..
done
```

{% callout type="note" title="Two paths to prod" %}
Production can be deployed either by merging to `master` (via `deploy.yml`) or by publishing a GitHub Release (via `deploy-prod.yml`). Both deploy all services to `--stage prod` with the same secrets. The release-based workflow gives a cleaner audit trail through GitHub's release history.
{% /callout %}

---

## CI Test

**File:** `.github/workflows/test.yml`

**Triggers:**

- All pull requests
- Push to `dev` or `master`

This workflow validates that all 21 services can be packaged by the Serverless Framework without errors. It does **not** run unit or integration tests — it only checks deployability.

### Dev packaging check

Runs on every PR and every push to `dev`/`master`:

```bash
cd services
for DIR in *; do
  cd "$DIR"
  sls package --stage dev &
  # ... background process
  cd ..
done
# wait for all to finish, fail if any errored
```

All 21 services are packaged in parallel (backgrounded with `&`) for speed. If any service fails to package, the workflow fails.

### Prod packaging check

Runs only on PRs targeting `master`:

```bash
# Same loop, but with --stage prod
sls package --stage prod &
```

This catches config errors that only appear in the production stage (different environment variables, different table names).

{% callout type="note" title="Not a full test suite" %}
The CI Test workflow validates Serverless Framework packaging only. For unit and integration tests, see the [Testing Guide](/docs/guides/testing). Tests are run locally with `npm run utest` and `npm run itest` — they are not part of the CI pipeline.
{% /callout %}

---

## autofix.ci (ESLint)

**File:** `.github/workflows/lint.yml`

**Triggers:**

- All pull requests
- Push to `master` or `dev`

Runs ESLint with `--fix` on the entire codebase and automatically commits any formatting changes back to the branch using the [autofix-ci/action](https://github.com/autofix-ci/action).

```bash
npx eslint . --fix
```

The commit message is `"Formatting with eslint"`. This means:

- On a PR branch, you may see an extra commit appear with formatting fixes
- On `dev`/`master`, formatting is applied after merge

---

## Manual deployment

To deploy a single service manually (for debugging or hotfixes):

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

### Deployment stages

| Stage  | Config file         | ENVIRONMENT var | DynamoDB suffix |
| ------ | ------------------- | --------------- | --------------- |
| `dev`  | `config.dev.json`   | `""`            | None            |
| `prod` | `config.prod.json`  | `"PROD"`        | `PROD`          |

### Custom domains

Managed by `serverless-domain-manager` in `serverless.common.yml`:

- Dev: `api-dev.ubcbiztech.com`
- Staging: `api-staging.ubcbiztech.com`
- Prod: `api.ubcbiztech.com`

---

## Secret categories

The deploy workflows pass many secrets as environment variables. These fall into a few categories:

- **AWS** — `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` for Lambda/DynamoDB/S3
- **Serverless** — `SERVERLESS_ACCESS_KEY` for the Serverless Framework dashboard
- **Stripe** — dev and prod keys, webhook signing secrets for checkout and cancellation
- **Discord** — application ID, public key, token (separate dev/prod tokens)
- **Slack** — bot token, signing secret, app token for the Slack bot
- **GitHub** — client ID, private key, project access key for GitHub App integration
- **Algolia** — app ID and API key for search indexing
- **Instagram** — access token for the Instagram Analytics service
- **OpenAI** — API key for AI features
- **Google Sheets** — service account credentials and spreadsheet config for Partnerships CRM sync

All secrets are stored in GitHub Actions repository secrets and injected at workflow runtime.

---

## Debugging a failed deploy

1. **Check the Actions tab** on GitHub — find the failed workflow run
2. **Read the error output** — look for the service that failed in the deploy loop
3. **Common failures:**
   - CloudFormation stack update failed → check the AWS CloudFormation console for the stack error
   - `sls package` failure → usually a missing environment variable or bad serverless.yml syntax
   - Import error → the `hello` service may not be deployed to this stage yet
   - Timeout → the deploy loop runs 21 services sequentially, so it can take 15-20 minutes

To test locally whether your code will package:

```bash
cd services/your-service
npx sls package --stage dev
```

---

## Key files

| File | Purpose |
| ---- | ------- |
| `.github/workflows/deploy.yml` | Deploy on merge to dev/master + docs dispatch |
| `.github/workflows/deploy-prod.yml` | Deploy on GitHub Release |
| `.github/workflows/test.yml` | Packaging check on PRs |
| `.github/workflows/lint.yml` | ESLint autofix |
| `serverless.common.yml` | Shared provider config, custom domains, plugins |
| `services/hello/serverless.yml` | Root service — creates shared API Gateway |
| `config.dev.json` / `config.prod.json` | Stage-specific configuration |

---

## Related pages

- [CI/CD Overview](/docs/cicd) — high-level pipeline summary
- [Frontend Workflows](/docs/cicd/frontend-workflows) — Vercel, Node.js CI, Prettier
- [Docs & Bot Sync](/docs/cicd/docs-sync) — cross-repo docs index pipeline
- [Backend Architecture](/docs/backend-architecture) — service structure and handler pattern
- [Testing Guide](/docs/guides/testing) — running tests locally
