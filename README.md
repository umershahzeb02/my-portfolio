# my-portfolio

Personal site — <https://umershahzeb02.github.io/my-portfolio/>

## Stack

| | |
| --- | --- |
| Build | Vite 8 |
| UI | React 19 |
| Styles | Tailwind CSS 4 (CSS-first `@theme`, no `tailwind.config.js`) |
| Type | Instrument Serif · Inter · JetBrains Mono |
| Deploy | GitHub Pages via `gh-pages` |

## Development

```bash
npm install
npm run dev        # local dev server
npm run build      # production build to dist/
npm run preview    # serve the built output
npm run deploy     # build, then publish dist/ to the gh-pages branch
```

## Editing content

All copy lives in [`src/data.js`](src/data.js) — profile, work, experience,
writing, stack, education. Layout code in `src/App.jsx` reads from it, so
updating the site is normally a matter of editing that one file.

## Blog

Posts are Markdown files in `content/blog/`, one per post, named for the slug
(`content/blog/my-post.md` → `/blog/my-post/`):

```markdown
---
title: My post
date: 2026-10-06
summary: Optional. Shown on the index and as the post's epigraph.
tags: [browsers, infra]
draft: true        # shows in `npm run dev`, never in a build
---

Body in Markdown. Code fences are highlighted at build time.
```

Images go in `public/blog/` and are linked root-relative
(`![Alt](/blog/diagram.png)`); the build adds the base path.

Beyond plain Markdown, a post can use:

| | Write | Gets |
| --- | --- | --- |
| Filename on code | ` ```js title="src/ui.jsx" ` | A caption above the block |
| Highlighted lines | ` ```js {2,4-5} `, or `// [!code highlight]` on a line | A wash across those lines |
| Diff lines | `// [!code ++]` / `// [!code --]` at the end of a line | Green / rose lines marked `+` / `−` |
| Callouts | `> [!NOTE]` (also `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`) on a quote's first line | A labelled aside |
| Figures | `![Alt](/blog/x.png "Caption")` alone in a paragraph | The image with the title as its caption |
| Footnotes | `text[^1]` … `[^1]: The note.` | Numbered references, notes at the foot |
| Maths | `$inline$`, `$$display$$` | KaTeX; its stylesheet loads only on posts that use it |
| Updated date | `updated: 2026-11-12` in frontmatter | "updated 12 Nov 2026" beside the date |

Every code block gets a copy button. Posts print as the article alone, in
the light palette, with link URLs written out. In browsers with
cross-document view transitions, a post's title travels from the list into
the post's header.

`npm run build` renders every page to static HTML: the client bundle, then a
server bundle of `src/entry-server.jsx`, then `scripts/prerender.mjs` writes
`index.html`, `blog/index.html`, `blog/<slug>/index.html`, `404.html` and
`blog/rss.xml`. React hydrates the result for the interactive bits. In dev,
`scripts/blog-plugin.mjs` serves the same pages through the same entry and
reloads when a post changes.

## Notes

Theme colours are design tokens declared in `src/index.css`. The dark variant
overrides those custom properties on `:root` inside a `prefers-color-scheme`
media query rather than declaring a second `@theme` block — `@theme` is only
honoured at the top level, and nesting it inside a media query drops the
condition and applies the values unconditionally.

`vite.config.js` sets `base: '/my-portfolio/'` to match the Pages sub-path.
Serving from a different path means changing it there.
