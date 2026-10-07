/* Last step of `npm run build`. The client build has produced dist/index.html
   with hashed asset links, and the SSR build an entry that renders any route;
   this writes one real HTML file per route, so Pages can serve every page,
   including a post's deep link, as a plain file with its content already in
   it. */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const ssr = path.join(root, "dist-ssr");

const template = await fs.readFile(path.join(dist, "index.html"), "utf8");
const { routes, renderPage, feed, sitemap, usesMath } = await import(pathToFileURL(path.join(ssr, "entry-server.js")).href);

const write = async (file, contents) => {
  const out = path.join(dist, file);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, contents);
  console.log(`  ${file}`);
};

console.log("prerendering");
for (const route of routes()) {
  // Pages serves 404.html, at whatever depth, for any path it has no file for.
  const file = route === "/404" ? "404.html" : path.join(route, "index.html");
  await write(file, renderPage(route, template).html);
}
await write("blog/rss.xml", feed());
await write("sitemap.xml", sitemap());

/* KaTeX's stylesheet and fonts, only when some post has maths. woff2 alone:
   it is first in every @font-face list, and every browser that runs this
   site reads it. */
if (usesMath()) {
  const katex = path.join(root, "node_modules/katex/dist");
  const out = path.join(dist, "assets/katex");
  await fs.mkdir(path.join(out, "fonts"), { recursive: true });
  await fs.copyFile(path.join(katex, "katex.min.css"), path.join(out, "katex.min.css"));
  const fonts = (await fs.readdir(path.join(katex, "fonts"))).filter((f) => f.endsWith(".woff2"));
  for (const f of fonts) await fs.copyFile(path.join(katex, "fonts", f), path.join(out, "fonts", f));
  console.log(`  assets/katex/ (stylesheet and ${fonts.length} fonts)`);
}

await fs.rm(ssr, { recursive: true, force: true });
