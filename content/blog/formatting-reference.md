---
title: Formatting reference
date: 2026-10-06
updated: 2026-10-07
summary: Every element a post can use, in one place, to check the styles against. A draft, so it shows in dev and never ships.
tags: [meta, markdown]
draft: true
---

This post exists to exercise the stylesheet. Each section below uses one piece of Markdown, so a change to `index.css` can be checked against all of them at once. Body copy wraps at a comfortable measure, **bold** reads a shade brighter, *italics* stay in the sans, and [links carry the gold rule](https://example.com) the rest of the site uses.

## Headings

A second-level heading opens each section and appears in the contents list. Hover one to reveal its anchor link.

### A third-level heading

Third-level headings sit under the second and stay out of the contents list, which is kept to one level so it never grows longer than the margin.

## Lists

- A first item, short.
- A second item that runs long enough to wrap onto another line, to check the hanging indent holds.
  - A nested item.
- A third.

1. Write the post as a `.md` file in `content/blog`.
2. Run `npm run dev` and read it in place.
3. Remove `draft: true` and deploy.

## Code

Inline code, like `useActiveSection(ids)`, sits on a faint wash. Blocks are highlighted at build time, in both themes, and carry a copy button. A `title` in the fence's info string names the file:

```js title="src/ui.jsx"
export function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  // By hand, so server and browser agree.
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
}
```

Lines can be picked out from the fence, as `{2,4}`:

```js {2,4}
const posts = await loadPosts(dir);
const published = posts.filter((p) => !p.draft);
const newest = published.at(0);
const feed = published.map(toItem);
```

Or marked in the code itself, as a diff:

```js
export default defineConfig({
  base: "/my-portfolio/",
  plugins: [react(), tailwindcss()], // [!code --]
  plugins: [react(), tailwindcss(), blog()], // [!code ++]
});
```

## Callouts

> [!NOTE]
> A note, for context a reader may want but can skip.

> [!TIP]
> A tip: something that makes the reader's next step easier.

> [!WARNING]
> A warning, for something that will bite if ignored.

> [!CAUTION]
> Caution, for something destructive or irreversible.

## Quotes

> A pulled quote, set apart from the argument around it.

A quote is set in Computer Modern, italic, in the accent.

## Figures

An image alone in its paragraph, with a title, becomes a figure and the title its caption:

![The site's icon](/apple-touch-icon.png "A root-relative path, with the base path added by the build.")

## Maths

Inline, like $e^{i\pi} + 1 = 0$, or on its own line:

$$
\sum_{k=1}^{n} k = \frac{n(n+1)}{2}
$$

## Footnotes

A claim can carry a note,[^1] and the note can say more than a parenthesis would.[^long]

[^1]: Footnotes number themselves in the order they are referenced.
[^long]: A longer note runs to more than one line, to check that its wrapping and the return link both hold up at the foot of the page.

## Tables

| Route | File | Notes |
| --- | --- | --- |
| `/blog/` | `blog/index.html` | Every published post, by year |
| `/blog/<slug>/` | `blog/<slug>/index.html` | One per Markdown file |
| `/blog/rss.xml` | `blog/rss.xml` | The feed |

---

That rule above is a section break. Images go in `public/blog/` and are written with a root-relative path, such as `![Alt text](/blog/diagram.png "Caption")`; the build adds the site's base path.
