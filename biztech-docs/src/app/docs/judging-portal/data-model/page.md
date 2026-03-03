---
title: Judging Portal Data Model (In Progress)
nextjs:
  metadata:
    title: Judging Portal Data Model (In Progress)
    description: Firestore collections and fields used by the BizTech Judging Portal. This section is still being refined.
---

This page lists the Firestore structure used by the judging portal. {% .lead %}

{% callout type="warning" title="In Progress" %}
This page is still being refined and may be updated as the app schema evolves.
{% /callout %}

---

## Event Root

- `events/{EVENT_ID}`

The app reads event settings from this document.

---

## Subcollections

### `events/{EVENT_ID}/judges`

- Purpose: judge and admin identity + assignment data
- Common fields:
  - `name`
  - `code`
  - `isAdmin`
  - `assignedTeamIds`
  - `capacity`

### `events/{EVENT_ID}/teams`

- Purpose: team profile + submission content
- Common fields:
  - `name`
  - `members`
  - `techStack`
  - `github`
  - `devpost`
  - `description`
  - `imageUrls`
  - `teamCode`

### `events/{EVENT_ID}/reviews`

- Purpose: scoring and written feedback
- Common fields:
  - `teamId`
  - `judgeId`
  - `judgeName`
  - `scores`
  - `feedback`
  - `total`
  - `weightedTotal`
  - `round` (`prelim` or `finals`)
  - `createdAt`

### `events/{EVENT_ID}/rubric/default`

- Purpose: scoring rubric config
- Common fields:
  - `name`
  - `scaleMax`
  - `criteria[]`

### `events/{EVENT_ID}/links`

- Purpose: extra team links managed by admins
- Common fields:
  - `teamId`
  - `title`
  - `url`
  - `createdAt`
  - `createdBy`

---

## Event Settings Fields

Common fields used throughout the app:

- `phase`
- `requiredJudgeCount`
- `maxImages`
- `lockSubmissions`
- `showResults`
- `showResultsFinals`
- `showTeamFeedback`
- `allowJudgeSeeOthers`
- `anonymizeTeams`
- `finalsTopN`
- `finalsTeamIds`
- `finalsJudgeIds`
