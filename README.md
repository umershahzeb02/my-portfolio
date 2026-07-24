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

## Notes

Theme colours are design tokens declared in `src/index.css`. The dark variant
overrides those custom properties on `:root` inside a `prefers-color-scheme`
media query rather than declaring a second `@theme` block — `@theme` is only
honoured at the top level, and nesting it inside a media query drops the
condition and applies the values unconditionally.

`vite.config.js` sets `base: '/my-portfolio/'` to match the Pages sub-path.
Serving from a different path means changing it there.
