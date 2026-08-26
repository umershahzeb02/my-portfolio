import { useEffect, useRef } from "react";

/* The hibiscus motif, painted live by p5.brush in the page.
 *
 * p5 and p5.brush are pulled in with dynamic import() so they land in their own
 * chunk and are fetched only when the ornament is actually going to paint —
 * night mode never downloads them.
 *
 * Five things the sketch needs that are not obvious:
 *
 *   1. p5.brush 1.1.4, not 2.x — 2.x dropped scaleBrushes.
 *   2. hatchStyle -> setHatch, fillBleed -> bleed. Those are the 1.1.4 names.
 *   3. Transforms must go through brush.push/rotate/pop. The library keeps its
 *      own transform stack; p5's globals leave all five petals stacked on top
 *      of one another instead of radiating.
 *   4. pixelDensity(1). Brushes are sized in DEVICE pixels, so on a retina
 *      screen every stroke comes out at double weight against unchanged
 *      geometry, and the motif turns into a dark blob.
 *   5. An OPAQUE ground. "Transparent" is transparent BLACK, and p5.brush
 *      builds its look from many semi-transparent dabs — on a clear canvas
 *      every dab blends toward black rather than toward paper. Measured:
 *      pixels below alpha 160 came back at luminance 2 out of 255. So the
 *      canvas is painted with the site's own --paper and the tile disappears
 *      against the page.
 */

const UNITS = 120;          // motif spans ~100 units
const PAPER = "#faf8f2";    // must match --paper in index.css

const COLORS = {
  gold: "#C5A059",
  rose: "#B97D78",
  crimson: "#991F25",
  ink: "#4a3c31",
};

const PAPER_RGB = [0xfa, 0xf8, 0xf2];

/* p5.brush has to paint onto opaque paper — on a clear canvas its
   semi-transparent dabs blend toward black. But an opaque tile is visible as a
   hard square the moment the cursor wash passes behind it, because the wash
   sits below the sidebar's stacking context and cannot reach the tile.
   mix-blend-mode cannot fix that either: the sidebar is z-index 10 and so
   isolates the blend from any backdrop.

   So the paper is keyed out afterwards. For ink over a known ground,
   C = a·F + (1-a)·P, which is one equation in two unknowns — but for pigment
   on paper the coverage is well approximated by how far the pixel darkens the
   ground, and the ink colour then follows:

       a = 1 - min(C/P)  per channel      F = (C - (1-a)·P) / a

   That keeps soft dabs soft — they come out partly transparent — rather than
   producing the hard cutout a colour-key threshold would give. */
function keyOutPaper(src, dst) {
  const w = dst.width;
  const h = dst.height;
  const ctx = dst.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(src, 0, 0, w, h);

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a =
      1 -
      Math.min(
        d[i] / PAPER_RGB[0],
        d[i + 1] / PAPER_RGB[1],
        d[i + 2] / PAPER_RGB[2],
      );
    if (a <= 0.004) {
      d[i + 3] = 0;
      continue;
    }
    const inv = 1 - a;
    for (let c = 0; c < 3; c++) {
      const v = (d[i + c] - inv * PAPER_RGB[c]) / a;
      d[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
    d[i + 3] = Math.round(Math.min(1, a) * 255);
  }
  ctx.putImageData(img, 0, 0);
}

function makeSketch(brush, display) {
  return (p) => {
    p.setup = () => {
      p.createCanvas(UNITS, UNITS, p.WEBGL);
      p.pixelDensity(1);
      if (typeof brush.instance === "function") brush.instance(p);
      if (typeof brush.load === "function") brush.load();
      brush.scaleBrushes(3);
      p.angleMode(p.DEGREES);
      p.noLoop();
    };

    p.draw = () => {
      p.background(PAPER);
      drawMotif(p, brush);
      // p5's own canvas stays offscreen; the visible one gets the keyed copy.
      keyOutPaper(p.canvas, display);
    };
  };
}

function drawMotif(p, brush) {
  for (let k = 0; k < 5; k++) drawPetal(p, brush, k);

  brush.push();
  brush.rotate(-15);
  brush.set("HB", COLORS.gold, 0.8);
  brush.line(0, 0, 0, -35);
  brush.fill(COLORS.gold, 200);
  for (let m = 0; m < 5; m++) {
    brush.circle(p.random(-4, 4), -35 + p.random(-5, 5), p.random(2, 4), 0.1);
  }
  brush.pop();
}

function drawPetal(p, brush, k) {
  brush.push();
  brush.rotate(k * 72);

  brush.fill(COLORS.rose, 140);
  brush.fillTexture(0.6, 0.4);
  brush.noStroke();
  brush.beginShape(0.6);
  brush.vertex(0, 0);
  brush.vertex(15, -35);
  brush.vertex(0, -50);
  brush.vertex(-15, -35);
  brush.endShape(true);

  brush.setHatch("HB", COLORS.crimson, 0.5);
  brush.hatch(1.5, 90, { rand: 0.2 });
  brush.beginShape(0.5);
  brush.vertex(0, -5);
  brush.vertex(8, -20);
  brush.vertex(0, -25);
  brush.vertex(-8, -20);
  brush.endShape(true);
  brush.noHatch();

  brush.set("pen", COLORS.ink, 0.4);
  brush.line(0, -5, 0, -40);
  brush.pop();
}

export default function Hibiscus({ className = "" }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    let sketch = null;
    let stage = null;
    let disposed = false;

    const teardown = () => {
      if (sketch) {
        try {
          sketch.remove();
        } catch (_) {
          /* p5 already torn down */
        }
        sketch = null;
      }
      if (stage) {
        stage.remove();
        stage = null;
      }
      if (hostRef.current) hostRef.current.replaceChildren();
    };

    const paint = async () => {
      if (sketch || disposed || !hostRef.current) return;
      try {
        const p5mod = await import("p5");
        if (disposed) return;
        const P5 = p5mod.default || p5mod;
        // p5.brush reaches for the global p5 as it initialises.
        window.p5 = P5;

        const brushMod = await import("p5.brush");
        if (disposed || !hostRef.current) return;
        const brush = brushMod.brush || brushMod.default || window.brush;
        if (!brush || typeof brush.scaleBrushes !== "function") return;

        // The canvas actually shown: receives the keyed, transparent copy.
        const display = document.createElement("canvas");
        display.width = UNITS;
        display.height = UNITS;
        hostRef.current.replaceChildren(display);

        // p5 paints on opaque paper in its own canvas, parked offscreen. It is
        // never shown — only the keyed copy is.
        stage = document.createElement("div");
        stage.setAttribute("aria-hidden", "true");
        stage.style.cssText =
          "position:absolute;left:-99999px;top:0;width:0;height:0;overflow:hidden";
        document.body.appendChild(stage);

        sketch = new P5(makeSketch(brush, display), stage);
      } catch (_) {
        /* the ornament is decorative — if it cannot load, the page is fine */
      }
    };

    const sync = () => {
      if (root.dataset.theme === "dark") teardown();
      else paint();
    };

    sync();
    // No event fires for a data attribute, so the toggle is observed directly.
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      disposed = true;
      obs.disconnect();
      teardown();
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
