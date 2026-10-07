/* The link-preview card (og:image): 1200x630, what LinkedIn, X and chat apps
 * show when someone shares the site. Build-time only, rendered by
 * render-art.mjs into public/og.png.
 *
 * Set on the day ivory in the site's own faces — Computer Modern for the name
 * and tagline, its typewriter cut for the footer — with the hibiscus at the
 * end of the name, as the sidebar sets it. Plain canvas, no brush: the only
 * painted thing here is the flower, and that is already painted.
 *
 * The words are fixed here, not read from src/data.js: this runs in a bare
 * browser page with no bundler. Re-render when the name, tagline or role
 * changes.
 */

(function () {
  const W = 1200;
  const H = 630;
  const TEXT = {
    name: "Shahzeb Umer",
    tagline: "“Simplicity is prerequisite for reliability.”",
    taglineBy: "— DIJKSTRA",
    role: "SOFTWARE ENGINEER · Z360",
    site: "umershahzeb02.github.io/my-portfolio",
  };
  const C = {
    paper: "#faf8f2",
    ink: "#080c0e",
    accent: "#0f6b60",
    muted: "#5f6166",
    rule: "#96760ab3",
  };

  async function load() {
    const faces = [
      new FontFace("CMU Serif", "url(/fonts/cmu-serif-700.woff2)", { weight: "700" }),
      new FontFace("CMU Serif", "url(/fonts/cmu-serif-500-italic.woff2)", { weight: "400", style: "italic" }),
      new FontFace("CMU Typewriter Text", "url(/fonts/cmu-typewriter.woff2)"),
    ];
    for (const f of faces) document.fonts.add(await f.load());
    const flower = new Image();
    flower.src = "/hibiscus-light.png";
    await flower.decode();
    return flower;
  }

  window.renderOg = async function () {
    const flower = await load();
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const x = c.getContext("2d");

    x.fillStyle = C.paper;
    x.fillRect(0, 0, W, H);

    const left = 96;
    const nameY = 300;

    // The name, with the flower tucked behind its final letter.
    x.font = '700 120px "CMU Serif"';
    const nameW = x.measureText(TEXT.name).width;
    const size = 200;
    x.globalAlpha = 0.55;
    x.drawImage(flower, left + nameW - size * 0.46, nameY - 42 - size * 0.56, size, size);
    x.globalAlpha = 1;
    x.fillStyle = C.ink;
    x.fillText(TEXT.name, left, nameY);

    x.font = 'italic 400 42px "CMU Serif"';
    x.fillStyle = C.accent;
    // Hung punctuation: the opening quote sits in the margin, so the words
    // line up with the name above.
    const quoteW = x.measureText("“").width;
    x.fillText(TEXT.tagline, left - quoteW, nameY + 70);
    x.font = '400 20px "CMU Typewriter Text"';
    x.letterSpacing = "3px";
    x.fillStyle = C.muted;
    x.fillText(TEXT.taglineBy, left, nameY + 112);
    x.letterSpacing = "0px";

    // Footer: a short gold rule, then the role and the address.
    x.fillStyle = C.rule;
    x.fillRect(left, 486, 64, 2);
    x.font = '400 24px "CMU Typewriter Text"';
    x.letterSpacing = "4px";
    x.fillStyle = C.muted;
    x.fillText(TEXT.role, left, 540);
    x.letterSpacing = "0px";
    x.font = '400 22px "CMU Typewriter Text"';
    const siteW = x.measureText(TEXT.site).width;
    x.fillText(TEXT.site, W - left - siteW, 540);

    return { dataURL: c.toDataURL("image/png"), bbox: { w: W, h: H, size: W } };
  };
})();
