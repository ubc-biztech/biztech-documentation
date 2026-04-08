---
title: Patterns & Conventions
nextjs:
  metadata:
    title: Patterns & Conventions
    description: React Query patterns, form handling, styling conventions, and coding standards in the BizTech frontend.
---

How we fetch data, handle forms, write styles, and structure code in the BizTech frontend. Follow these patterns for consistency. {% .lead %}

---

## Data Fetching with React Query

### Query Hooks (src/queries/)

Each query hook follows this pattern:

```typescript
// src/queries/useEvents.ts
import { useQuery } from "@tanstack/react-query";
import { fetchBackend } from "@/lib/db";

export function useEvents() {
  return useQuery({
    queryKey: ["events"],          // Cache key
    queryFn: () => fetchBackend({  // Fetcher function
      endpoint: "/events",
      method: "GET",
    }),
    staleTime: 5 * 60 * 1000,     // Optional: how long data stays fresh
  });
}
```

### Using Query Hooks in Components

```typescript
function EventList() {
  const { data: events, isLoading, error } = useEvents();

  if (isLoading) return <Spinner />;
  if (error) return <p>Failed to load events</p>;

  return events.map(event => <EventCard key={event.id} event={event} />);
}
```

### Mutations

For creating/updating data, use `useMutation`:

```typescript
const mutation = useMutation({
  mutationFn: (data) => fetchBackend({
    endpoint: "/events",
    method: "POST",
    body: data,
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["events"] });
    toast({ title: "Event created!" });
  },
});
```

---

## Form Patterns

We use two form libraries depending on the component's age:

### react-hook-form + Zod (preferred for new code)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
});

function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = form.handleSubmit((data) => {
    // data is fully typed and validated
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

### Formik (legacy, some older forms)

Some older forms still use Formik. When modifying these, you don't need to rewrite them, but new forms should use react-hook-form.

---

## Styling Conventions

### Tailwind Class Order

We use the `cn()` utility from `src/lib/utils.ts` to merge Tailwind classes:

```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "rounded-xl border bg-bt-blue-500/40 p-4",   // Base styles
  isActive && "border-bt-green-400 bg-bt-green-400/10",  // Conditional
  className  // Allow overrides from props
)} />
```

### Color Usage

Always use our brand colors (`bt-blue-*`, `bt-green-*`, `bt-red-*`) instead of generic Tailwind colors:

```
✅ text-bt-blue-100      (our light blue)
❌ text-blue-400         (generic Tailwind blue)

✅ bg-bt-green-400       (our brand green)
❌ bg-green-500          (generic Tailwind green)
```

### Responsive Design

Use Tailwind responsive prefixes. Our custom breakpoints:

| Prefix | Width | Use For |
| --- | --- | --- |
| `xxs:` | 360px | Very small phones |
| `xs:` | 412px | Standard phones |
| `mxs:` | 445px | Larger phones |
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets / small laptops |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large screens |

Mobile-first approach: write base styles for mobile, then add `sm:`, `md:`, etc. for larger screens:

```html
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
```

---

## Conventions & Best Practices

### File Naming
- Components: `PascalCase.tsx` (e.g., `EventCard.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useEvents.ts`)
- Utilities: `camelCase.ts` (e.g., `utils.ts`)
- Constants: `camelCase.ts` (e.g., `navigation.ts`)

### Component Structure
```typescript
// 1. Imports
import { useState } from "react";
import { cn } from "@/lib/utils";

// 2. Types (if component-specific)
interface Props {
  title: string;
  children: React.ReactNode;
}

// 3. Component
export function MyComponent({ title, children }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}
```

### Import Aliases
Always use the `@/` alias instead of relative paths:

```typescript
✅ import { Button } from "@/components/ui/button";
❌ import { Button } from "../../../components/ui/button";
```
