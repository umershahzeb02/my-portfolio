/* The blog's content pipeline. Every post is a Markdown file in content/blog,
   named for its slug; this turns the folder into a `virtual:blog` module that
   the server entry imports. Only the server side ever imports it — the browser
   receives a page's data inlined in that page's HTML, so no visitor downloads
   every post to read one.

   In dev it also serves the site's pages itself, rendered through the same
   entry the build uses, so `npm run dev` shows exactly what will ship. */
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import footnote from "markdown-it-footnote";
import katexPlugin from "@vscode/markdown-it-katex";
import Shiki from "@shikijs/markdown-it";
import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationHighlight,
} from "@shikijs/transformers";

const VIRTUAL = "virtual:blog";
const RESOLVED = "\0" + VIRTUAL;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const WORDS_PER_MINUTE = 220;

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CALLOUTS = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
};

/* Every fenced block comes out of Shiki inside a figure: an optional caption
   naming the file (```js title="vite.config.js"), a copy button the page
   wires up once it is live, then the highlighted <pre>. */
const codeFrame = () => ({
  name: "code-frame",
  root(root) {
    const title = this.options.meta?.title;
    const el = (tagName, properties, text) => ({
      type: "element",
      tagName,
      properties,
      children: [{ type: "text", value: text }],
    });
    return {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "figure",
          properties: { className: ["code"] },
          children: [
            ...(title ? [el("figcaption", { className: ["code-title"] }, title)] : []),
            el("button", { type: "button", className: ["code-copy"], ariaLabel: "Copy code" }, "Copy"),
            ...root.children,
          ],
        },
      ],
    };
  },
});

const inlineText = (token) =>
  (token?.children ?? [])
    .filter((c) => c.type === "text" || c.type === "code_inline")
    .map((c) => c.content)
    .join("");

async function createMarkdown(base) {
  const md = MarkdownIt({ html: true, linkify: true, typographer: true });

  md.use(anchor, {
    slugify,
    level: [2, 3],
    tabIndex: false,
    permalink: anchor.permalink.linkInsideHeader({
      symbol: "#",
      placement: "after",
      ariaHidden: true,
      class: "header-anchor",
    }),
  });

  /* Highlighted at build time, both palettes at once. With defaultColor off,
     every token carries --shiki-light and --shiki-dark and index.css picks
     one, so code follows the theme toggle without re-rendering anything.

     Lines are marked from the fence's meta (```js {2,4-5}) or from comments
     in the code itself (// [!code highlight], // [!code ++], // [!code --]),
     which Shiki strips from the output. */
  md.use(
    await Shiki({
      themes: { light: "vitesse-light", dark: "vitesse-dark" },
      defaultColor: false,
      defaultLanguage: "text",
      fallbackLanguage: "text",
      parseMetaString: (raw) => {
        const title = raw.match(/\b(?:title|file)="([^"]+)"/);
        return title ? { title: title[1] } : {};
      },
      transformers: [
        transformerMetaHighlight(),
        transformerNotationHighlight(),
        transformerNotationDiff(),
        codeFrame(),
      ],
    }),
  );

  /* Footnotes number plainly, without markdown-it's brackets, and the list
     opens under a label rather than after a rule: a rule in a post is a
     section break, set as an asterism, which is not what this is. */
  md.use(footnote);
  md.renderer.rules.footnote_caption = (tokens, idx) => {
    const { id, subId } = tokens[idx].meta;
    return subId > 0 ? `${id + 1}:${subId}` : String(id + 1);
  };
  md.renderer.rules.footnote_block_open = () =>
    '<section class="footnotes" aria-label="Footnotes">\n<p class="footnotes-title">Notes</p>\n<ol class="footnotes-list">\n';

  /* $inline$ and $$display$$ maths, typeset by KaTeX at build time: HTML
     for the eye, MathML alongside it for screen readers. Its stylesheet and
     fonts are self-hosted and linked only from posts that use them; the
     browser's own MathML was not enough, since without a maths font
     installed it draws a Σ at text size. */
  md.use(katexPlugin.default ?? katexPlugin, { throwOnError: false });

  /* GitHub's alert syntax — a quote opening with [!NOTE], [!TIP],
     [!IMPORTANT], [!WARNING] or [!CAUTION] — becomes a labelled aside. */
  md.core.ruler.after("inline", "callouts", (state) => {
    const t = state.tokens;
    for (let i = 0; i < t.length; i++) {
      if (t[i].type !== "blockquote_open" || t[i + 1]?.type !== "paragraph_open") continue;
      const inline = t[i + 2];
      const marker = inline.content.match(/^\[!(\w+)\][ \t]*(?:\n|$)/);
      const kind = marker?.[1].toLowerCase();
      if (!CALLOUTS[kind]) continue;

      // Drop the marker, and the line break after it, from the paragraph.
      inline.children.splice(0, inline.children[1]?.type === "softbreak" ? 2 : 1);
      inline.content = inline.content.slice(marker[0].length);
      if (!inline.children.length) t[i + 1].hidden = t[i + 3].hidden = true;

      const close = t.findIndex(
        (c, j) => j > i && c.type === "blockquote_close" && c.level === t[i].level,
      );
      t[i].tag = t[close].tag = "aside";
      t[i].attrSet("class", `callout callout-${kind}`);
      const label = new state.Token("html_block", "", 0);
      label.content = `<p class="callout-label">${CALLOUTS[kind]}</p>\n`;
      t.splice(i + 1, 0, label);
    }
  });

  /* An image alone in its paragraph, with a title, is a figure: the title
     becomes its caption. ![A diagram](/blog/x.png "What it shows") */
  md.core.ruler.after("inline", "figures", (state) => {
    const t = state.tokens;
    for (let i = 0; i < t.length - 2; i++) {
      const [open, inline, close] = [t[i], t[i + 1], t[i + 2]];
      if (open.type !== "paragraph_open" || inline.type !== "inline") continue;
      const [image, ...rest] = inline.children;
      if (image?.type !== "image" || rest.length || !image.attrGet("title")) continue;
      open.tag = close.tag = "figure";
      const caption = new state.Token("html_inline", "", 0);
      caption.content = `<figcaption>${escapeHtml(image.attrGet("title"))}</figcaption>`;
      image.attrs = image.attrs.filter(([name]) => name !== "title");
      inline.children.push(caption);
    }
  });

  /* A post writes `/blog/foo.png`, meaning the site's root; on Pages the site
     lives under the base path, so root-relative URLs get it prepended. */
  const withBase = (url) =>
    url && url.startsWith("/") && !url.startsWith("//") ? base + url.slice(1) : url;
  md.core.ruler.push("base-urls", (state) => {
    for (const block of state.tokens) {
      for (const t of block.children ?? []) {
        if (t.type === "link_open") t.attrSet("href", withBase(t.attrGet("href")));
        if (t.type === "image") {
          t.attrSet("src", withBase(t.attrGet("src")));
          t.attrSet("loading", "lazy");
        }
      }
    }
  });

  return md;
}

async function loadPosts(dir, md, { drafts }) {
  let files;
  try {
    files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }

  const posts = [];
  for (const file of files) {
    const where = path.join(dir, file);
    const slug = file.slice(0, -3);
    const { data, content } = matter(await fs.readFile(where, "utf8"));

    /* Bad frontmatter fails the build by name rather than shipping a broken
       page. YAML reads an unquoted date as a Date, so both forms are taken. */
    const day = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? ""));
    const date = day(data.date);
    const updated = data.updated ? day(data.updated) : null;
    if (!SLUG.test(slug)) throw new Error(`${where}: filename must be a lowercase-hyphenated slug`);
    if (!data.title) throw new Error(`${where}: frontmatter needs a title`);
    if (!DATE.test(date)) throw new Error(`${where}: frontmatter needs a date as YYYY-MM-DD`);
    if (updated && !DATE.test(updated)) throw new Error(`${where}: updated must be YYYY-MM-DD`);
    if (data.draft && !drafts) continue;

    const env = {};
    const tokens = md.parse(content, env);
    const headings = tokens.flatMap((t, i) =>
      t.type === "heading_open" && t.tag === "h2"
        ? [{ id: t.attrGet("id"), text: inlineText(tokens[i + 1]) }]
        : [],
    );
    const firstPara = tokens.findIndex((t) => t.type === "paragraph_open");
    const words = content.split(/\s+/).filter(Boolean).length;

    const html = md.renderer.render(tokens, md.options, env);

    posts.push({
      slug,
      title: String(data.title),
      date,
      // Only worth saying when it differs from the publication date.
      updated: updated && updated !== date ? updated : null,
      summary: data.summary ? String(data.summary) : inlineText(tokens[firstPara + 1]),
      // A summary taken from the opening paragraph is fine in a list, but the
      // post itself would show it twice; only a written one heads the post.
      excerpt: !data.summary,
      tags: [].concat(data.tags ?? []).map(String),
      draft: Boolean(data.draft),
      minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
      headings,
      math: html.includes('class="katex'),
      html,
    });
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

/* Routes the dev server renders itself. Anything with a file extension is an
   asset and goes on to Vite, except the feed. */
const isPage = (route) => route === "/" || /^\/blog(\/[^./]+)?\/?$/.test(route);

export default function blog({ dir = "content/blog" } = {}) {
  let contentDir, base, drafts, markdown;
  const md = () => (markdown ??= createMarkdown(base));

  return {
    name: "blog",

    configResolved(config) {
      contentDir = path.resolve(config.root, dir);
      base = config.base;
      // Drafts show while writing and never ship.
      drafts = config.command === "serve";
    },

    resolveId(id) {
      if (id === VIRTUAL) return RESOLVED;
    },

    async load(id) {
      if (id !== RESOLVED) return;
      const posts = await loadPosts(contentDir, await md(), { drafts });
      return `export default ${JSON.stringify(posts)};`;
    },

    configureServer(server) {
      /* The virtual module has no file of its own, so a change anywhere in the
         folder — including a new post — invalidates it by hand. */
      server.watcher.add(contentDir);
      const refresh = (file) => {
        if (!file.startsWith(contentDir) || !file.endsWith(".md")) return;
        for (const env of Object.values(server.environments)) {
          const mod = env.moduleGraph.getModuleById(RESOLVED);
          if (mod) env.moduleGraph.invalidateModule(mod);
        }
        server.ws.send({ type: "full-reload" });
      };
      for (const event of ["add", "change", "unlink"]) server.watcher.on(event, refresh);

      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        const pathname = req.url.split("?")[0];
        if (!pathname.startsWith(base)) return next();
        const route = "/" + pathname.slice(base.length);

        try {
          const entry = await server.ssrLoadModule("/src/entry-server.jsx");

          if (route === "/blog/rss.xml") {
            res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
            return res.end(entry.feed());
          }
          if (!isPage(route)) return next();
          // Pages does this redirect for a directory; match it so links agree.
          if (!route.endsWith("/")) {
            res.writeHead(301, { Location: pathname + "/" });
            return res.end();
          }

          const template = await server.transformIndexHtml(
            req.url,
            await fs.readFile(path.resolve(server.config.root, "index.html"), "utf8"),
          );
          const page = entry.renderPage(route, template);
          res.statusCode = page.status;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(page.html);
        } catch (e) {
          server.ssrFixStacktrace(e);
          next(e);
        }
      });
    },
  };
}
