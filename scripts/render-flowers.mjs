/* Pre-renders the hibiscus once per theme and writes the PNGs into public/.
 *
 *   npm run render:flowers
 *
 * Why this exists: p5.brush needs WebGL, so something has to run a browser.
 * But the sketch is seeded, so it produces identical pixels every time — which
 * makes shipping a megabyte of p5 to every visitor, to redraw a fixed image on
 * their machine, pure waste. Rendering once at build time gives the same
 * artwork for the cost of two small PNGs.
 *
 * No Puppeteer or Playwright: Chrome is already installed and can be driven
 * headlessly from the command line. This script serves the harness over
 * localhost, launches Chrome at it, and receives the finished images back by
 * POST — a browser cannot write to disk, and file:// would block the fetch.
 *
 * Deliberately NOT wired into `npm run build`. It needs Chrome and a few
 * seconds; a normal build should not depend on either. Run it when the sketch
 * changes and commit the output.
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
// Into src/assets, not public/: Vite then fingerprints the files and
// rewrites the base path, so CSS can reference them and only the theme
// actually in use gets fetched.
const OUT_DIR = join(ROOT, "src", "assets");
const PORT = 8917;
const THEMES = ["light", "dark"];

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];

const chrome = CHROME_CANDIDATES.find((p) => p && existsSync(p));
if (!chrome) {
  console.error("No Chrome or Edge found. Looked in:\n  " + CHROME_CANDIDATES.join("\n  "));
  process.exit(1);
}

const FILES = {
  "/p5.js": join(ROOT, "node_modules/p5/lib/p5.min.js"),
  "/p5.brush.js": join(ROOT, "node_modules/p5.brush/dist/p5.brush.js"),
  "/flower-sketch.js": join(HERE, "flower-sketch.js"),
};
for (const [route, file] of Object.entries(FILES)) {
  if (!existsSync(file)) {
    console.error(`Missing ${file} (for ${route}). Run npm install first.`);
    process.exit(1);
  }
}

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8"><title>render</title></head>
<body style="margin:0;background:#888">
<script src="/p5.js"></script>
<script src="/p5.brush.js"></script>
<script src="/flower-sketch.js"></script>
<script>
(async function () {
  const post = (path, body) =>
    fetch(path, { method: "POST", headers: { "Content-Type": "text/plain" }, body });
  try {
    for (const key of ${JSON.stringify(THEMES)}) {
      const { dataURL, bbox } = await window.renderFlower(key);
      await post("/save?name=" + key, dataURL.split(",")[1]);
      await post("/log", key + " bbox " + (bbox ? bbox.w + "x" + bbox.h + " crop " + bbox.size : "empty"));
    }
    await post("/done", "ok");
  } catch (e) {
    await post("/fail", String((e && e.stack) || e));
  }
})();
</script>
</body></html>`;

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const written = [];
let failure = null;
let finish;
const finished = new Promise((r) => (finish = r));

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const send = (code, type, body) => {
    res.writeHead(code, { "Content-Type": type, "Access-Control-Allow-Origin": "*" });
    res.end(body);
  };

  if (req.method === "GET") {
    if (url.pathname === "/") return send(200, "text/html", PAGE);
    const file = FILES[url.pathname];
    if (file) return send(200, "application/javascript", readFileSync(file));
    return send(404, "text/plain", "no");
  }

  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    if (url.pathname === "/save") {
      const name = url.searchParams.get("name");
      const out = join(OUT_DIR, `hibiscus-${name}.png`);
      const buf = Buffer.from(body, "base64");
      writeFileSync(out, buf);
      written.push({ name, bytes: buf.length, out });
      console.log(`  wrote hibiscus-${name}.png  ${buf.length} bytes`);
    } else if (url.pathname === "/log") {
      console.log("  " + body);
    } else if (url.pathname === "/fail") {
      failure = body;
      finish();
    } else if (url.pathname === "/done") {
      finish();
    }
    send(200, "text/plain", "ok");
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`rendering with ${chrome}`);
  const proc = spawn(
    chrome,
    [
      "--headless=new",
      // Software WebGL: headless has no real GPU, and without these the
      // canvas comes back blank rather than erroring.
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      `--user-data-dir=${join(ROOT, "node_modules", ".cache", "flower-chrome")}`,
      `http://127.0.0.1:${PORT}/`,
    ],
    { stdio: "ignore" },
  );

  const timeout = setTimeout(() => {
    failure = failure || "timed out after 60s";
    finish();
  }, 60000);

  finished.then(() => {
    clearTimeout(timeout);
    try { proc.kill(); } catch {}
    server.close();

    if (failure) {
      console.error("\nFAILED:\n" + failure);
      process.exit(1);
    }
    const missing = THEMES.filter((t) => !written.some((w) => w.name === t));
    if (missing.length) {
      console.error(`\nFAILED: no image for ${missing.join(", ")}`);
      process.exit(1);
    }
    console.log(`\ndone — ${written.length} image(s) in public/`);
    process.exit(0);
  });
});
