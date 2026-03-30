---
title: Component Library
nextjs:
  metadata:
    title: Component Library
    description: UI primitives, shadcn/ui components, and common shared components in the BizTech frontend.
---

A guide to the building blocks of the BizTech frontend: our UI primitives, shared components, and how they're organized. {% .lead %}

---

## Component Organization

Components live in `src/components/` and are organized by feature area, not by type. Here's the mental model:

```
src/components/
├── ui/                    ← Low-level primitives (shadcn/ui + custom)
├── Common/                ← Shared across many pages
├── NavBar/                ← App shell navigation
├── EventCard/             ← Event browsing cards
├── Events/                ← Event creation/editing forms
├── EventsDashboard/       ← Admin event dashboard
├── RegistrationTable/     ← Data table for registrations
├── Companion/             ← Companion app components
├── Connections/           ← Connection history
├── LiveWall/              ← Real-time connection walls
├── SignUpForm/            ← Membership signup
├── QrScanner/             ← QR scanning
├── QrCodeCompanion/       ← QR companion interactions
├── NFCWrite/              ← NFC tag writing (admin)
├── Blocks/                ← Content blocks (hero, footer)
├── Loading.tsx            ← Loading spinner
└── ConfigureAmplify.tsx   ← Amplify initialization
```

{% callout title="Rule of Thumb" %}
If a component is used by only one page, it can live in that page's feature directory (`src/features/`). If it's shared across pages, it belongs in `src/components/`.
{% /callout %}

---

## UI Primitives (`src/components/ui/`)

These are our building blocks. Most come from [shadcn/ui](https://ui.shadcn.com/) and are built on Radix UI primitives. They're unstyled by default and use Tailwind for styling.

### Commonly Used Components

| Component | Import | Usage |
| --- | --- | --- |
| `Button` | `@/components/ui/button` | Primary actions, with variants: `default`, `outline`, `ghost`, `destructive` |
| `Dialog` | `@/components/ui/dialog` | Modal dialogs (confirmations, forms) |
| `Select` | `@/components/ui/select` | Dropdown selects |
| `Input` | `@/components/ui/input` | Text inputs |
| `Tabs` | `@/components/ui/tabs` | Tab navigation |
| `Table` | `@/components/ui/table` | Data tables |
| `Toast` | `@/components/ui/toast` | Notification toasts |
| `Form` | `@/components/ui/form` | react-hook-form integration |
| `Skeleton` | `@/components/ui/skeleton` | Loading placeholders |
| `Spinner` | `@/components/ui/spinner` | Loading spinner |
| `DropdownMenu` | `@/components/ui/dropdown-menu` | Context menus |
| `AlertDialog` | `@/components/ui/alert-dialog` | Confirmation dialogs |

### Custom UI Components

Beyond shadcn, we have custom primitives:

| Component | Purpose |
| --- | --- |
| `GradientText` | Text with gradient styling |
| `AnimatedBorder` | Animated border effects |
| `CompanionButton` | Styled button for companion UIs |
| `CompanionItemRow` | List item row for companion UIs |
| `ConnectedButton` | Connection action button |
| `SectionCard` | Card with icon + title header (used in dashboards) |

### Adding a New shadcn Component

```bash
npx shadcn-ui@latest add [component-name]
```

This generates the component in `src/components/ui/` with proper Tailwind styling. You can then customize it freely.

---

## Common Components (`src/components/Common/`)

Shared components used across multiple pages:

| Component | What It Does |
| --- | --- |
| `SearchBar` | Reusable search input with debounce |
| `Pagination` | Page navigation for tables and lists |
| `GenericCard` | Base card component with consistent styling |
| `FilterSelect` | Dropdown filter for data views |
| `ConfirmDialog` | Reusable confirmation modal |
| `EmptyState` | "No data" placeholder with icon |
