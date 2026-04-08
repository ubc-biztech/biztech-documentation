---
title: Docs & Bot Sync
nextjs:
  metadata:
    title: Docs & Bot Sync
    description: How the documentation site triggers the Slack bot docs index rebuild — the cross-repo pipeline from biztech-documentation to serverless-biztechapp.
---

When the documentation site is updated, a cross-repo pipeline rebuilds the Slack bot's search index and redeploys the backend. This page explains that flow. {% .lead %}

---

## The problem this solves

The BizTech Slack bot answers documentation questions by searching a pre-built index of all doc pages. That index lives in the backend repo at `services/bots/docsIndex.js`. When docs are updated, the index needs to be rebuilt so the bot returns current answers.

---

## How the pipeline works

```
biztech-documentation repo          serverless-biztechapp repo
┌──────────────────────┐           ┌──────────────────────────┐
│ Push to main         │           │                          │
│        │             │           │                          │
│        ▼             │           │                          │
│ trigger-bot-update   │──dispatch──▶ deploy.yml              │
│ workflow fires       │  event    │ (repository_dispatch)    │
│                      │           │        │                 │
│                      │           │        ▼                 │
│                      │           │ 1. Checkout docs repo    │
│                      │           │ 2. Build docs index      │
│                      │           │ 3. Deploy all to dev     │
│                      │           │                          │
└──────────────────────┘           └──────────────────────────┘
```

### Step 1 — Docs repo triggers dispatch

**File:** `biztech-documentation/.github/workflows/trigger-bot-update.yml`

On every push to `main` (or manual `workflow_dispatch`), this workflow sends a `repository_dispatch` event to the backend repo:

```yaml
- uses: peter-evans/repository-dispatch@v3
  with:
    token: ${{ secrets.SERVERLESS_REPO_DISPATCH_TOKEN }}
    repository: ubc-biztech/serverless-biztechapp
    event-type: biztech_docs_updated
    client-payload: >
      {
        "source_repository": "...",
        "source_branch": "...",
        "source_sha": "..."
      }
```

The `client-payload` includes the commit SHA so the backend workflow can check out the exact version of docs that triggered the update.

### Step 2 — Backend receives dispatch

The backend `deploy.yml` workflow listens for `repository_dispatch` events with type `biztech_docs_updated`:

```yaml
on:
  push:
    branches: [dev, master]
  repository_dispatch:
    types: [biztech_docs_updated]
```

When this event arrives, three conditional steps run:

1. **Checkout docs repo** — clones `biztech-documentation` at the dispatch SHA into a `biztech-documentation/` subdirectory
2. **Build docs index** — runs the index generator pointing at the checked-out docs
3. **Verify output** — confirms `services/bots/docsIndex.js` was created

### Step 3 — Index generation

The build command:

```bash
npm run build:slack-docs-index -- --docs-root ./biztech-documentation/biztech-docs/src/app
```

This runs `scripts/generateSlackDocsIndex.js`, which:

1. Recursively finds all `page.md` files under the docs app directory
2. Parses YAML frontmatter with `gray-matter` for page titles
3. Splits each page into sections by heading, then chunks sections into ~350-1200 character pieces
4. Generates a normalized `searchText` field for each chunk (lowercased, alphanumeric only)
5. Writes the output to `services/bots/docsIndex.js`

The generated file exports:

- `docsBaseUrl` — the public docs URL (`https://bizwiki.vercel.app`)
- `docsIndexGeneratedAt` — timestamp of generation
- `docsChunkCount` — total number of chunks
- `docsChunks` — array of chunk objects with `id`, `route`, `url`, `title`, `section`, `content`, and `searchText`

### Step 4 — Deploy to dev

After rebuilding the index, the workflow deploys all 21 services to `--stage dev`. This includes the `bots` service, which now serves the updated index when the Slack bot searches for docs answers.

{% callout type="note" title="Dev only" %}
The docs dispatch only triggers a dev deployment. Production deployment happens separately via merge to `master` or a GitHub Release. The `docsIndex.js` file in the repo would need to be committed and merged to `master` for production to pick it up.
{% /callout %}

---

## Running the index build locally

```bash
cd serverless-biztechapp-1
npm run build:slack-docs-index
```

By default, the script looks for docs at `../biztech-documentation/biztech-docs/src/app` (relative to the backend repo root). If your docs repo is elsewhere:

```bash
npm run build:slack-docs-index -- --docs-root /path/to/docs/src/app
```

The output file is `services/bots/docsIndex.js`.

---

## Manual trigger

The docs workflow supports `workflow_dispatch`, so you can trigger it manually from the GitHub Actions tab on the docs repo. This is useful if you need to rebuild the bot index without pushing a new commit.

---

## Authentication

The dispatch requires a personal access token (`SERVERLESS_REPO_DISPATCH_TOKEN`) stored in the docs repo's secrets. This token must have `repo` scope on the `ubc-biztech/serverless-biztechapp` repository to send `repository_dispatch` events.

---

## Key files

| File                                       | Repo                  | Purpose                                  |
| ------------------------------------------ | --------------------- | ---------------------------------------- |
| `.github/workflows/trigger-bot-update.yml` | biztech-documentation | Sends dispatch on docs push              |
| `.github/workflows/deploy.yml`             | serverless-biztechapp | Receives dispatch, builds index, deploys |
| `scripts/generateSlackDocsIndex.js`        | serverless-biztechapp | Parses docs into searchable chunks       |
| `services/bots/docsIndex.js`               | serverless-biztechapp | Generated index file (auto-generated)    |

---

## Related pages

- [CI/CD Overview](/docs/cicd) — high-level pipeline summary
- [Backend Workflows](/docs/cicd/backend-workflows) — full deploy workflow details
- [Discord & Slack Bots](/docs/deep-dives/bots) — the bot service that uses the docs index
