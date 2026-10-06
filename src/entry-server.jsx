/* Turns a route into a finished HTML document. The build calls this once per
   page (scripts/prerender.mjs) and the dev server once per request
   (scripts/blog-plugin.mjs), so the two cannot drift apart. */
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import posts from "virtual:blog";
import pkg from "../package.json";
import Page from "./Page";
import { profile } from "./data";
/* The display face's bold — the name and every title. Imported for its URL
   only; the hash matches the file the client build emits from index.css. */
import displayFont from "computer-modern/fonts/cmu-serif-700-roman.woff2?url";

const SITE = pkg.homepage.replace(/\/?$/, "/");
const NAME = profile.name;
const DEFAULT_TITLE = `${NAME} — Software Engineer`;
const DEFAULT_DESCRIPTION =
  "Software engineer. Browser internals, multimodal AI, and production platforms at scale. Simplicity is prerequisite for reliability.";

/* KaTeX's stylesheet, for posts with maths. In dev, Vite serves it straight
   from node_modules; the build copies it, and the woff2 fonts beside it, into
   dist (scripts/prerender.mjs). The browser fetches only the fonts a page's
   equations actually use. */
const KATEX_CSS = import.meta.env.DEV
  ? `${import.meta.env.BASE_URL}node_modules/katex/dist/katex.min.css`
  : `${import.meta.env.BASE_URL}assets/katex/katex.min.css`;
export const usesMath = () => posts.some((p) => p.math);

const absolute = (route) => new URL(route.replace(/^\//, ""), SITE).href;

/* What a list needs to show a post. The body stays out, so the home page and
   the index do not carry every article in their inlined data. */
const card = ({ slug, title, date, updated, summary, tags, minutes, draft }) => ({
  slug,
  title,
  date,
  updated,
  summary,
  tags,
  minutes,
  draft,
});

export const routes = () => ["/", "/blog/", ...posts.map((p) => `/blog/${p.slug}/`), "/404"];

function resolve(route) {
  if (route === "/") {
    return { data: { page: "home", posts: posts.slice(0, 3).map(card) } };
  }
  if (route === "/blog/") {
    return {
      data: { page: "blog", posts: posts.map(card) },
      head: {
        title: `Blog — ${NAME}`,
        description: "Notes on browser internals, automation, infrastructure and web architecture.",
      },
    };
  }
  const i = posts.findIndex((p) => route === `/blog/${p.slug}/`);
  if (i !== -1) {
    const post = posts[i];
    return {
      data: {
        page: "post",
        post,
        // Numbered oldest first, as the index numbers it, for its ornament.
        n: posts.length - i,
        newer: posts[i - 1] ? card(posts[i - 1]) : null,
        older: posts[i + 1] ? card(posts[i + 1]) : null,
      },
      head: {
        title: `${post.title} — ${NAME}`,
        description: post.summary,
        type: "article",
        published: post.date,
        modified: post.updated,
        math: post.math,
      },
    };
  }
  return { status: 404, data: { page: "notfound" }, head: { title: `Not found — ${NAME}` } };
}

const attr = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function headTags(route, head = {}) {
  const title = head.title ?? DEFAULT_TITLE;
  const description = head.description || DEFAULT_DESCRIPTION;
  const url = absolute(route === "/404" ? "/" : route);
  return [
    `<title>${attr(title)}</title>`,
    `<meta name="description" content="${attr(description)}" />`,
    `<link rel="canonical" href="${attr(url)}" />`,
    `<meta property="og:type" content="${head.type ?? "website"}" />`,
    `<meta property="og:title" content="${attr(title)}" />`,
    `<meta property="og:description" content="${attr(description)}" />`,
    `<meta property="og:url" content="${attr(url)}" />`,
    head.published && `<meta property="article:published_time" content="${head.published}" />`,
    head.modified && `<meta property="article:modified_time" content="${head.modified}" />`,
    /* Computer Modern sets the name and every title, in both themes, and the
       title is the first thing anyone reads; fetched up front rather than
       when the stylesheet gets round to it, it lands before first paint
       instead of swapping in after. */
    `<link rel="preload" href="${displayFont}" as="font" type="font/woff2" crossorigin />`,
    head.math && `<link rel="stylesheet" href="${KATEX_CSS}" />`,
    `<link rel="alternate" type="application/rss+xml" title="${attr(NAME)}" href="${attr(absolute("/blog/rss.xml"))}" />`,
  ]
    .filter(Boolean)
    .join("\n    ");
}

export function renderPage(route, template) {
  const { status = 200, data, head } = resolve(route);
  const app = renderToString(
    <StrictMode>
      <Page data={data} />
    </StrictMode>,
  );
  /* The page's data rides along for hydration. Escaping < keeps a post that
     mentions </script> from closing the tag early. */
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  const html = template
    .replace("<!--app-head-->", headTags(route, head))
    .replace("<!--app-html-->", app)
    .replace("<!--app-data-->", `<script id="page-data" type="application/json">${json}</script>`);
  return { status, html };
}

const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function feed() {
  const items = posts
    .map((p) => {
      const url = absolute(`/blog/${p.slug}/`);
      return `
    <item>
      <title>${xml(p.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${xml(p.summary)}</description>
    </item>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xml(NAME)}</title>
    <link>${absolute("/blog/")}</link>
    <description>Notes on browser internals, automation, infrastructure and web architecture.</description>${items}
  </channel>
</rss>
`;
}
