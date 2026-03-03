---
title: Judging Portal Routes
nextjs:
  metadata:
    title: Judging Portal Routes
    description: Route map for admin, judge, team, and public pages.
---

This page maps major routes by user role. {% .lead %}

---

## Authentication And Entry

- `/auth` - sign in with role + code
- `/` - redirects users based on role and event state

---

## Admin Routes

- `/admin` - admin home
- `/admin/settings` - event toggles and phase
- `/admin/judges` - judge/admin management
- `/admin/teams` - teams list and team CRUD
- `/admin/teams/[teamId]` - team detail, assignment, links, reviews
- `/admin/assign` - assignment matrix and exports
- `/admin/rubric` - rubric editing
- `/admin/finals` - finals team/judge selection and finals phase
- `/admin/links` - external links manager
- `/admin/seed-teams` - bulk team seed utility

---

## Judge Routes

- `/judge` - assigned prelim queue
- `/judge/[teamId]` - prelim scoring form
- `/judge/finals` - assigned finals queue
- `/judge/finals/[teamId]` - finals scoring form

---

## Team And Public Routes

- `/submit` - team submission editor
- `/team/feedback` - team feedback and score breakdown
- `/results` - leaderboard and result exports
