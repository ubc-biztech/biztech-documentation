---
title: BizTech Judging Portal
nextjs:
  metadata:
    title: BizTech Judging Portal
    description: Beginner-friendly overview for the Hello Hacks/BizTech judging portal.
---

This section documents the **BizTech Judging Portal** app (`hello-hacks-judging-portal`) for new developers joining the project. {% .lead %}

The portal is a Next.js app used during hackathons for team submissions, judging, finals, and results.

---

## Start Here

Use these pages in order:

- [Setup and Local Development](/docs/judging-portal/setup/)
- [Firestore Data Model](/docs/judging-portal/data-model/)
- [Route Map](/docs/judging-portal/routes/)

---

## What The App Does

- Role-based sign in for `admin`, `judge`, and `team` users
- Team submission editing (GitHub, Devpost, description, images)
- Judge assignment and scoring (prelim + finals)
- Results/leaderboard view with visibility controls
- Team feedback view and CSV exports

---

## Stack At A Glance

- Framework: Next.js (Pages Router)
- UI: React + Tailwind CSS
- Data: Firebase Firestore
- Media: Firebase Storage
- Session model: localStorage (`hh_session_v1`)

```text
Admin / Judge / Team Browser
            |
            v
Next.js Frontend (hello-hacks-portal)
    |                |                 |
    |                |                 +--> localStorage session (hh_session_v1)
    |                |
    |                +--------------------> Firebase Storage (team images)
    |
    +-------------------------------------> Firestore (events, teams, judges, reviews)
```

---

## Repository Location

- Root: `hello-hacks-judging-portal`
- App: `hello-hacks-portal`
