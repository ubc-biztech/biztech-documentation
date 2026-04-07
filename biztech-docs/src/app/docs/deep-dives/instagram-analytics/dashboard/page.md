---
title: 'Instagram Analytics: Dashboard Guide'
nextjs:
  metadata:
    title: 'Instagram Analytics Dashboard Guide'
    description: 'Detailed walkthrough of filters, summary cards, charts, top posts, and post-level analytics UI.'
---

This page breaks down each section of the admin Instagram dashboard and how to read it.

---

## Filters

Top filter block includes:
- `since` and `until` date inputs
- quick presets: `Last 30d`, `Last 90d`, `YTD`
- `Apply` action for manual range
- refresh button for re-fetching with current range

Guardrails:
- both dates required
- `since` must be before/equal to `until`

---

## Summary Cards

Current cards:

| Card | Meaning |
| --- | --- |
| Posts in Range | Number of posts published in selected dates |
| New Followers | Net follower growth in selected dates |
| Total Likes / Views / Comments / Saves / Shares | Aggregate post metrics in range |
| Content Reach | Sum of per-post reach |
| Total Engagement | Likes + comments + saves + shares |
| Engagement Rate | Engagement divided by post reach |
| Avg Reach / Post | `postReach / posts` |
| Avg Engagement / Post | `engagement / posts` |

{% callout title="Reach vs views" %}
**Reach** = unique accounts reached. **Views** = total views/plays (can be higher than reach).
{% /callout %}

---

## Mid-Page Analysis Blocks

- **Engagement Mix**: stacked share by likes/comments/saves/shares
- **Performance Ratios**: like/comment/save/share rates by reach + view/reach ratio
- **Best Posting Windows**:
  - top weekdays by engagement rate
  - top hours by average reach

---

## Monthly Rollups

Monthly section includes:
- combo chart (`posts` bars + `avgReachPerPost` line)
- trend chart (`likes`, `views`, `engagementRateByReach`)
- desktop monthly summary table

If no monthly data exists in the selected range, an empty state is shown.

---

## Top Posts

Tabbed rankings:
- Reach
- ER by Reach
- Saves
- Shares

Each row links to the post permalink and shows compact metric context.

---

## Post-Level Analytics

Responsive presentation:
- desktop: full metric table
- tablet: compact table
- mobile: card-based compact rows

Includes pagination controls (`Previous`, `Next`).

---

## Loading, Empty, and Error States

- skeleton screen while loading
- inline empty states for missing data sections
- top-level error alert for failed API responses
- "refreshing" spinner on manual refresh
