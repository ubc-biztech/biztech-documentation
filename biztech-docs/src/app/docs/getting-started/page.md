---
title: Getting Started
nextjs:
  metadata:
    title: Getting Started
    description: Everything you need to set up the BizTech development environment from scratch.
---

Everything you need to clone, configure, and run the BizTech app locally, covering both the frontend and backend. {% .lead %}

---

## Prerequisites

Before you begin, make sure you have the following installed on your machine:

| Tool                          | Version                | How to Install                                                                                                     |
| ----------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Node.js**                   | v20+ (LTS recommended) | [nodejs.org](https://nodejs.org) or `brew install node`                                                            |
| **npm**                       | v9+ (comes with Node)  | Included with Node.js                                                                                              |
| **Git**                       | Latest                 | `brew install git` or [git-scm.com](https://git-scm.com)                                                           |
| **AWS CLI**                   | v2                     | `brew install awscli` or [AWS docs](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| **Serverless Framework**      | v3                     | `npm install -g serverless@3`                                                                                      |
| **Java** (for local DynamoDB) | JRE 11+                | `brew install openjdk@11`                                                                                          |

{% callout title="macOS Users" %}
We recommend using [Homebrew](https://brew.sh) to install tools. On Windows, use WSL2 (Windows Subsystem for Linux) for the best experience.
{% /callout %}

---

## Repository Overview

BizTech has two main repositories:

| Repository                | What it is       | Tech Stack                                             |
| ------------------------- | ---------------- | ------------------------------------------------------ |
| `bt-web-v2`               | Frontend web app | Next.js 14, TypeScript, Tailwind, AWS Amplify          |
| `serverless-biztechapp-1` | Backend API      | Serverless Framework, Node.js 20, AWS Lambda, DynamoDB |

Both repos should be cloned into the same parent directory for the easiest setup:

```bash
mkdir ~/BizTech && cd ~/BizTech
git clone https://github.com/ubc-biztech/bt-web-v2.git
git clone https://github.com/ubc-biztech/serverless-biztechapp-1.git
```

---

## Setting Up the Backend

### 1. Install dependencies

```bash
cd serverless-biztechapp-1
npm install
```

### 2. Environment configuration

The backend uses three config files for different environments: `config.dev.json`, `config.staging.json`, and `config.prod.json`. When running locally, the `dev` config is used by default.

The key difference between environments:

| Config Key        | Dev / Staging       | Production |
| ----------------- | ------------------- | ---------- |
| `ENVIRONMENT`     | `""` (empty string) | `"PROD"`   |
| `REQUIRE_API_KEY` | `false`             | `true`     |

{% callout type="warning" title="Table Name Suffixes" %}
All DynamoDB table names automatically get the `ENVIRONMENT` value appended. In dev, tables are `biztechEvents`. In production, they become `biztechEventsPROD`. This prevents accidentally writing to production data.
{% /callout %}

### 3. Set up local DynamoDB

The backend uses a local DynamoDB instance for development. First install the Serverless DynamoDB plugin, then seed the database:

```bash
# Install DynamoDB Local (one-time setup)
npx sls dynamodb install

# Seed local DB with a copy of production data (requires AWS credentials)
node scripts/initlocal.js
```

{% callout title="AWS Credentials Required" %}
You need valid AWS credentials configured (`~/.aws/credentials`) with access to the BizTech AWS account to run the seed script. Ask the dev lead for access.
{% /callout %}

### 4. Set up environment variables

Create a `.env` file in the backend root (or export these in your shell):

```bash
# Required for local development
ENVIRONMENT=""
REACT_APP_STAGE=dev

# Stripe (for payments)
STRIPE_KEY=sk_test_...
STRIPE_MEMBERSHIP_PRICE_ID=price_...

# SendGrid (for registration emails)
SENDGRID_KEY=SG...

# Algolia (for profile search)
ALGOLIA_APP_ID=...
ALGOLIA_ADMIN_API_KEY=...

# OpenAI (for profile recommendations)
OPENAI_API_KEY=sk-...

# Slack/Discord (for bot integrations)
SLACK_BOT_TOKEN=xoxb-...
DISCORD_BOT_TOKEN=...
DISCORD_APP_ID=...
DISCORD_PUBLIC_KEY=...
```

{% callout type="warning" title="Never Commit Secrets" %}
Never commit `.env` files or API keys to Git. These files are in `.gitignore`. Ask in the slack for the dev environment keys.
{% /callout %}

### 5. Start the backend

```bash
npm start
```

This reads `sls-multi-gateways.yml` to discover all active services, then starts each with `sls offline` on sequential ports starting at **4001**. A lightweight Express proxy runs on **port 4000** that routes requests to the correct service by URL path prefix.

```bash
# Start only specific services (much faster during dev)
npm start events users registrations
```

| Port | Service                            | Path prefix          |
| ---- | ---------------------------------- | -------------------- |
| 4000 | **Proxy** (send all requests here) | —                    |
| 4001 | events                             | `/events`            |
| 4002 | hello                              | `/hello`             |
| 4003 | members                            | `/members`           |
| 4004 | payments                           | `/payments`          |
| 4005 | prizes                             | `/prizes`            |
| 4006 | qr                                 | `/qr`                |
| 4007 | quests                             | `/quests`            |
| 4008 | qr (qrscan)                        | `/qrscan`            |
| 4009 | registrations                      | `/registrations`     |
| 4010 | interactions                       | `/interactions`      |
| 4011 | teams                              | `/team`              |
| 4012 | teams                              | `/teams`             |
| 4013 | transactions                       | `/transactions`      |
| 4014 | users                              | `/users`             |
| 4015 | profiles                           | `/profiles`          |
| 4016 | bots                               | `/discord`, `/slack` |
| 4017 | btx                                | `/btx`               |
| 4018 | investments                        | `/investments`       |

Verify it's working:

```bash
curl http://localhost:4000/hello
# Should return: "Hello World"
```

---

## Setting Up the Frontend

### 1. Install dependencies

```bash
cd bt-web-v2
npm install
```

### 2. Environment variables

Create a `.env.local` file in the frontend root:

```bash
# Points the frontend to your local backend
NEXT_PUBLIC_REACT_APP_STAGE=local

# AWS Amplify config (uses the staging Cognito pool for local dev)
# These are already configured in amplify_outputs.json, no action needed
```

The `NEXT_PUBLIC_REACT_APP_STAGE` variable controls which backend URL the frontend talks to:

| Value                       | Backend URL                      |
| --------------------------- | -------------------------------- |
| `local`                     | `http://localhost:4000`          |
| `production`                | `https://api.ubcbiztech.com`     |
| _(anything else, or unset)_ | `https://api-dev.ubcbiztech.com` |

{% callout title="Running Without the Backend" %}
If you omit `NEXT_PUBLIC_REACT_APP_STAGE` or set it to anything other than `local`, the frontend will talk to the deployed dev backend. This is useful if you're only working on frontend changes.
{% /callout %}

### 3. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

### 4. Login

- Visit `http://localhost:3000/login`
- Use your `@ubcbiztech.com` email to log in (this automatically grants admin access)
- Alternatively, use Google OAuth if configured

---

## Project Scripts Cheat Sheet

### Frontend (bt-web-v2)

| Command            | What it does                      |
| ------------------ | --------------------------------- |
| `npm run dev`      | Start the dev server on port 3000 |
| `npm run build`    | Build for production              |
| `npm run lint`     | Run ESLint                        |
| `npx tsc --noEmit` | Type-check without building       |

### Backend (serverless-biztechapp-1)

| Command                       | What it does                          |
| ----------------------------- | ------------------------------------- |
| `npm start`                   | Start all configured services locally |
| `npm test`                    | Run all unit tests                    |
| `node scripts/initlocal.js`   | Seed local DynamoDB from production   |
| `npx sls deploy --stage dev`  | Deploy to dev environment             |
| `npx sls deploy --stage prod` | Deploy to production                  |

---

## Common Issues & Fixes

### "Cannot connect to DynamoDB Local"

Make sure Java is installed and DynamoDB Local is running:

```bash
java -version  # Should show JRE 11+
npx sls dynamodb install  # Re-install if needed
```

### "401 Unauthorized" on API calls

Your Cognito session may have expired. Log out and log back in. If running locally, make sure `NEXT_PUBLIC_REACT_APP_STAGE=local` in your `.env.local` and the backend is running on port 4000.

### "Module not found" errors

Try clearing your `node_modules` and reinstalling:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Port conflicts

If ports 4000–4019 are in use, kill existing processes:

```bash
lsof -ti:4000 | xargs kill -9
```

### Amplify/Auth issues locally

The frontend uses the **staging** Cognito User Pool for local development (configured in `amplify_outputs.json`). If you're getting auth errors, verify the Amplify config is pointing to the correct pool.

---

## Next Steps

Once you have both the frontend and backend running locally:

- Read the [Frontend Architecture](/docs/frontend-architecture) guide to understand how the Next.js app is structured
- Read the [Backend Architecture](/docs/backend-architecture) guide to understand the serverless services
- Check the [Database Guide](/docs/database) to understand our DynamoDB tables
- Read the [Authentication](/docs/authentication) guide to understand the auth flow
