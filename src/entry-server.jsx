/* Turns a route into a finished HTML document. The build calls this once per
   page (scripts/prerender.mjs) and the dev server once per request
   (scripts/blog-plugin.mjs), so the two cannot drift apart. */
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import posts from "virtual:blog";
import pkg from "../package.json";
import Page from "./Page";
import { education, experience, links, profile } from "./data";
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

/* Who the site is about, for search engines: a schema.org Person on the
   home page, so a search for the name can show the right profile. Built from
   data.js, so it follows the current role without being edited. */
const person = () => {
  const [role] = experience;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: SITE,
    email: `mailto:${profile.email}`,
    jobTitle: role.role,
    worksFor: { "@type": "Organization", name: role.orgShort, ...(role.orgHref && { url: role.orgHref }) },
    alumniOf: education.map((e) => ({ "@type": "EducationalOrganization", name: e.school })),
    sameAs: [links.github, links.linkedin, links.medium],
  };
};

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
    /* The link-preview card, rendered by render-art.mjs into public/og.png.
       index.html already asks for a large card; this supplies it. */
    `<meta property="og:image" content="${attr(absolute("/og.png"))}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${attr(`${NAME} — ${profile.tagline}`)}" />`,
    `<meta name="twitter:image" content="${attr(absolute("/og.png"))}" />`,
    head.published && `<meta property="article:published_time" content="${head.published}" />`,
    head.modified && `<meta property="article:modified_time" content="${head.modified}" />`,
    /* Computer Modern sets the name and every title, in both themes, and the
       title is the first thing anyone reads; fetched up front rather than
       when the stylesheet gets round to it, it lands before first paint
       instead of swapping in after. */
    `<link rel="preload" href="${displayFont}" as="font" type="font/woff2" crossorigin />`,
    head.math && `<link rel="stylesheet" href="${KATEX_CSS}" />`,
    // "<" escaped, so nothing in the data can close the script tag.
    route === "/" &&
      `<script type="application/ld+json">${JSON.stringify(person()).replace(/</g, "\\u003c")}</script>`,
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

/* Every public page, for sitemap.xml. A post's lastmod is its updated date,
   or failing that its date; the index changes when its newest post does. */
export function sitemap() {
  const newest = posts[0] && (posts[0].updated ?? posts[0].date);
  const entries = [
    { loc: absolute("/") },
    { loc: absolute("/blog/"), lastmod: newest },
    ...posts.map((p) => ({ loc: absolute(`/blog/${p.slug}/`), lastmod: p.updated ?? p.date })),
  ];
  const urls = entries
    .map((e) => `  <url>\n    <loc>${e.loc}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
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
