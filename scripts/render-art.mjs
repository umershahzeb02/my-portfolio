/* Pre-renders the site's painted artwork, once per theme, into src/assets.
 *
 *   npm run render:art                 everything
 *   npm run render:art -- ornaments    just the post ornaments
 *   npm run render:art -- flowers      just the hibiscus
 *
 * Why this exists: p5.brush needs WebGL, so something has to run a browser.
 * But the sketches are seeded, so they produce identical pixels every time —
 * which makes shipping a megabyte of p5 to every visitor, to redraw a fixed
 * image on their machine, pure waste. Rendering once at build time gives the
 * same artwork for the cost of a few small PNGs.
 *
 * No Puppeteer or Playwright: Chrome can be driven headlessly from the
 * command line. This script serves the harness over localhost, launches Chrome
 * at it, and receives the finished images back by POST — a browser cannot
 * write to disk, and file:// would block the fetch.
 *
 * Deliberately NOT wired into `npm run build`. It needs Chrome and a few
 * seconds; a normal build should not depend on either. Run it when a sketch
 * changes and commit the output. Render only what changed: software WebGL on
 * another machine can shift a few pixels of artwork that has not.
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { homedir, tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
// Into src/assets, not public/: Vite then fingerprints the files and
// rewrites the base path, so CSS can reference them and only the theme
// actually in use gets fetched.
const ASSETS = join(ROOT, "src", "assets");
const ORNAMENTS = join(ASSETS, "ornaments");
const PORT = 8917;
const THEMES = ["light", "dark"];
const ORNAMENT_COUNT = 10;

/* What can be rendered. Each job names its output and the call into the
   sketch that paints it; the page runs them in order. */
const TARGETS = {
  flowers: {
    sketch: "flower-sketch.js",
    jobs: THEMES.map((t) => ({ file: join(ASSETS, `hibiscus-${t}.png`), call: `renderFlower(${JSON.stringify(t)})` })),
  },
  ornaments: {
    sketch: "ornament-sketch.js",
    jobs: Array.from({ length: ORNAMENT_COUNT }, (_, i) => i + 1).flatMap((n) =>
      THEMES.map((t) => ({ file: join(ORNAMENTS, `ornament-${n}-${t}.png`), call: `renderOrnament(${n}, ${JSON.stringify(t)})` })),
    ),
    after: writeOrnamentCss,
  },
};

const asked = process.argv.slice(2);
const unknown = asked.filter((a) => !TARGETS[a]);
if (unknown.length) {
  console.error(`Unknown target ${unknown.join(", ")}. Choose from: ${Object.keys(TARGETS).join(", ")}`);
  process.exit(1);
}
const selected = asked.length ? asked : Object.keys(TARGETS);
const jobs = selected.flatMap((name) => TARGETS[name].jobs);

/* Chrome or Edge, wherever this machine keeps it. CHROME overrides; after
   that the usual install paths on each platform, then any Chromium a
   Playwright install has downloaded. */
function playwrightChromes() {
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, "/ms-playwright", join(homedir(), ".cache", "ms-playwright")];
  const found = [];
  for (const root of roots.filter(Boolean)) {
    if (!existsSync(root)) continue;
    for (const dir of readdirSync(root).filter((d) => d.startsWith("chromium-"))) {
      for (const sub of ["chrome-linux64", "chrome-linux", "chrome-mac/Chromium.app/Contents/MacOS/Chromium"]) {
        found.push(sub.includes("/") ? join(root, dir, sub) : join(root, dir, sub, "chrome"));
      }
    }
  }
  return found;
}
const CHROME_CANDIDATES = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  ...playwrightChromes(),
].filter(Boolean);

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error("No Chrome or Edge found. Set CHROME, or install one. Looked in:\n  " + CHROME_CANDIDATES.join("\n  "));
  process.exit(1);
}

const FILES = {
  "/p5.js": join(ROOT, "node_modules/p5/lib/p5.min.js"),
  "/p5.brush.js": join(ROOT, "node_modules/p5.brush/dist/p5.brush.js"),
  ...Object.fromEntries(selected.map((name) => [`/${TARGETS[name].sketch}`, join(HERE, TARGETS[name].sketch)])),
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
${Object.keys(FILES).map((route) => `<script src="${route}"></script>`).join("\n")}
<script>
(async function () {
  const post = (path, body) =>
    fetch(path, { method: "POST", headers: { "Content-Type": "text/plain" }, body });
  try {
${jobs
  .map(
    (job, i) => `    {
      const { dataURL, bbox } = await window.${job.call};
      await post("/save?job=${i}", dataURL.split(",")[1]);
      await post("/log", ${JSON.stringify(job.call)} + " bbox " + (bbox ? bbox.w + "x" + bbox.h + " crop " + bbox.size : "empty"));
    }`,
  )
  .join("\n")}
    await post("/done", "ok");
  } catch (e) {
    await post("/fail", String((e && e.stack) || e));
  }
})();
</script>
</body></html>`;

/* Each ornament is a CSS background, like the flower: only the theme in use
   is fetched, and nothing runs. Generated with the images so the two cannot
   drift; index.css imports it. */
function writeOrnamentCss() {
  const rule = (n, t) =>
    `${t === "light" ? ':root:not([data-theme="dark"]) ' : ""}.ornament[data-n="${n}"] { background-image: url("./ornament-${n}-${t}.png"); }`;
  const lines = [];
  for (let n = 1; n <= ORNAMENT_COUNT; n++) lines.push(rule(n, "dark"), rule(n, "light"));
  const css = `/* Generated by scripts/render-art.mjs — do not edit by hand.\n   Night is the default, as everywhere in index.css; day overrides it. */\n${lines.join("\n")}\n`;
  writeFileSync(join(ORNAMENTS, "ornaments.css"), css);
  console.log("  wrote ornaments/ornaments.css");
}

for (const dir of [ASSETS, ORNAMENTS]) if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const written = new Set();
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
      const job = jobs[Number(url.searchParams.get("job"))];
      const buf = Buffer.from(body, "base64");
      writeFileSync(job.file, buf);
      written.add(job);
      console.log(`  wrote ${job.file.slice(ASSETS.length + 1)}  ${buf.length} bytes`);
    } else if (url.pathname === "/log") {
      console.log("    " + body);
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
  console.log(`rendering ${selected.join(", ")} with ${chrome}`);
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
      // A fresh profile every run. A shared one keeps Chrome's lock file
      // when a run is killed, and the next Chrome then quietly refuses it.
      `--user-data-dir=${mkdtempSync(join(tmpdir(), "render-art-"))}`,
      `http://127.0.0.1:${PORT}/`,
    ],
    { stdio: "ignore" },
  );

  // Software WebGL paints an ornament in about six seconds; allow fifteen each.
  const limit = 30000 + jobs.length * 15000;
  const timeout = setTimeout(() => {
    failure = failure || `timed out after ${limit / 1000}s`;
    finish();
  }, limit);

  finished.then(() => {
    clearTimeout(timeout);
    try { proc.kill(); } catch {}
    server.close();

    if (failure) {
      console.error("\nFAILED:\n" + failure);
      process.exit(1);
    }
    const missing = jobs.filter((j) => !written.has(j));
    if (missing.length) {
      console.error(`\nFAILED: nothing came back for ${missing.map((j) => j.call).join(", ")}`);
      process.exit(1);
    }
    for (const name of selected) TARGETS[name].after?.();
    console.log(`\ndone — ${written.size} image(s) in src/assets`);
    process.exit(0);
  });
});
