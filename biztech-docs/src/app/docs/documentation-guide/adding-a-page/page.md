---
title: Writing a New Documentation Page
description: How to create a new documentation page and add it to the sidebar.
---

There are two ways to add a new page: use the **Page Builder** (recommended for most people) or create the files manually. {% .lead %}

---

## Option A: Use the Page Builder

The Page Builder is a visual editor at [`/builder`](/builder) that lets you write documentation without touching any code. It handles Markdoc formatting, navigation placement, and PR submission all in one place.

### Getting started

1. Go to [`/builder`](/builder) (or click **Builder** in the top nav).
2. Pick a **template** to start from, or choose **Blank Page** to start from scratch.
3. Fill in your **page title**, **section name**, and **description** at the top.

### Writing content

The editor is block-based (similar to Notion). Each block is a content element:

| Block | What it does |
| --- | --- |
| **Lead Paragraph** | Large intro text shown at the top of the page |
| **Paragraph** | Regular body text |
| **Heading 2 / 3 / 4** | Section headings |
| **Bullet List** | Unordered list |
| **Numbered List** | Ordered list |
| **Code Block** | Syntax-highlighted code with language selector |
| **Callout** | Highlighted tip, warning, or note box |
| **Table** | Data table with editable rows and columns |
| **Quick Links** | Grid of linked cards |
| **Divider** | Horizontal rule |
| **Image** | Image with alt text and optional caption |

Add blocks by clicking the **+** button between blocks, or type `/` inside any block to open the slash command menu.

### Formatting text

Select text inside a block to open the inline toolbar, which supports **bold**, *italic*, `code`, and [links](#). You can also use keyboard shortcuts:

- **Bold**: `Ctrl/Cmd + B`
- **Italic**: `Ctrl/Cmd + I`
- **Code**: `Ctrl/Cmd + E`
- **Link**: `Ctrl/Cmd + K`

### Previewing your page

Use the view toggle in the toolbar to switch between **Editor**, **Preview**, and **Split** mode. The preview renders your page exactly as it will look on the live site.

### Submitting your page

When you're happy with your page:

1. Click **Submit as PR** (or the 🚀 button on mobile).
2. Authenticate with GitHub if prompted.
3. Fill in a **branch name** and **PR description**.
4. Use the **Navigation Picker** to choose where your page should appear in the sidebar -- inside an existing section or as a new section.
5. Click **Create Pull Request**. The builder will generate the Markdoc file, update `navigation.js`, and open a PR on GitHub automatically.

{% callout title="No coding required" %}
The builder generates valid Markdoc, handles frontmatter, and updates the sidebar navigation automatically. You don't need to clone the repo or edit any files by hand.
{% /callout %}

### Other features

- **Drafts**: Your work auto-saves to local storage. You can manage multiple drafts from the draft picker in the toolbar.
- **Templates**: Start from pre-built templates (Getting Started guide, API Reference, Service guide, and more).
- **Export**: Click **Export Markdoc** to copy or download the raw `.md` file if you prefer to submit manually.
- **Focus Mode**: Hide the toolbar and sidebar for distraction-free writing.
- **Undo/Redo**: `Ctrl/Cmd + Z` to undo, `Ctrl/Cmd + Shift + Z` to redo.
- **Drag and Drop**: Reorder blocks by dragging the handle on the left side of each block.
- **Keyboard Shortcuts**: Press `Ctrl/Cmd + /` to see all available shortcuts.

---

## Option B: Create the Page Manually

If you prefer working directly in the codebase, you can create the Markdown file and update the navigation by hand.

### 1. Create the Markdown file

All documentation pages live inside `src/app/docs/`.

To create a new page, make a new folder and add a `page.md` inside it. For example:

```bash
mkdir src/app/docs/your-page-name
touch src/app/docs/your-page-name/page.md
```

The `page.md` file must include frontmatter at the top, like this:

```md
---
title: Your Page Title
description: A short description of what this page covers.
---
```

Then write your content using Markdoc. See the [Markdown Guide](/docs/documentation-guide/markdown-guide) for syntax reference.

### 2. Add the page to the navigation

The docs sidebar is controlled by the `navigation.js` file:

```
src/lib/navigation.js
```

Find the section you want your page to appear under (e.g. **Getting Started** or **Users**) and add a new link like this:

```js
{
  title: 'Getting Started',
  links: [
    { title: 'Documentation Guide', href: '/docs/documentation-guide' },
    { title: 'Your Page Title', href: '/docs/your-page-name' }, // add this
  ],
},
```

If you want to create a whole new section in the sidebar, just add a new object to the `navigation` array:

```js
{
  title: 'New Section Title',
  links: [
    { title: 'Your Page Title', href: '/docs/your-page-name' },
  ],
}
```

### Example

Let's say you want to add a page about how deployments work.

1. Create the file:

   ```
   mkdir src/app/docs/deployment
   touch src/app/docs/deployment/page.md
   ```

2. Add your content to `page.md`:

   ```md
   ---
   title: Deployment Guide
   description: How to deploy and host BizTech apps.
   ---
   ```

3. Update `navigation.js`:

   ```js
   {
     title: 'Getting Started',
     links: [
       { title: 'Documentation Guide', href: '/docs/documentation-guide' },
       { title: 'Deployment Guide', href: '/docs/deployment' },
     ],
   }
   ```

That's it! Your new page should now show up in the sidebar.

---

{% callout title="Page not showing up?" type="warning" %}
Make sure your folder name and `href` in `navigation.js` match exactly, and that you included the frontmatter in your Markdown file.
{% /callout %}
