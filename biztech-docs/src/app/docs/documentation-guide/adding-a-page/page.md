---
title: Writing a New Documentation Page
description: How to create a new documentation page and add it to the sidebar.
---

Creating a new page in the BizTech docs involves two steps: making the page file, and registering it in the navigation so it shows up in the sidebar. {% .lead %}

---

## 1. Create the Markdown File

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

Then you can start writing your content using Markdown as usual.

## 2. Add the Page to the Navigation

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
    { title: 'Your Page Title', href: '/docs/your-page-name' }, // ← add this
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

## Example

Let’s say you want to add a page about how deployments work.

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

Done - your new page should now show up in the sidebar.

---

{% callout title="Page not showing up?" type="warning" %}
Make sure your folder name and `href` in `navigation.js` match exactly - and that you included the frontmatter in your Markdown file.
{% /callout %}
