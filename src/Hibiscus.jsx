import { useEffect, useRef } from "react";

/* The hibiscus, painted live by p5.brush.
 *
 * Vector filters could rough up an outline and mottle a fill, but they cannot
 * reproduce what a brush engine does: hundreds of individual dabs, each with
 * its own position and pressure, accumulating into a stroke. That is where the
 * character lives, so the sketch runs for real.
 *
 * The cost is real too — p5 is about a megabyte plus a WebGL context. It is
 * kept off the critical path rather than hidden:
 *   * dynamic import(), so both libraries land in their own chunks and the
 *     main bundle is unaffected
 *   * the fetch starts from an effect, after first paint, so nothing about the
 *     page render waits on it. The flower simply arrives a moment later.
 *
 * Five things the sketch needs that are not obvious, each of which produced a
 * visibly wrong render before it was found:
 *
 *   1. p5.brush 1.1.4, not 2.x — 2.x dropped scaleBrushes.
 *   2. hatchStyle -> setHatch, fillBleed -> bleed. Those are the 1.1.4 names.
 *   3. Transforms must go through brush.push/rotate/pop. The library keeps its
 *      own transform stack; p5's globals leave all five petals stacked on top
 *      of one another rather than radiating — it measured 98x154 instead of
 *      square.
 *   4. pixelDensity(1). Brushes are sized in DEVICE pixels, so on a retina
 *      screen every stroke doubles in weight against unchanged geometry and
 *      the motif turns into a dark blob.
 *   5. An OPAQUE ground. "Transparent" is transparent BLACK, and p5.brush
 *      builds its look from semi-transparent dabs, so on a clear canvas each
 *      one blends toward black: pixels below alpha 160 measured luminance 2
 *      out of 255.
 *
 * Because of (5) the sketch paints on paper offscreen, and the paper is then
 * keyed out per pixel so the visible canvas carries real alpha. That matters
 * for more than tidiness: an opaque tile showed a hard square edge whenever
 * the cursor wash passed behind it, since the wash sits at z-index 0 and the
 * sidebar at 10, so the tile could never receive it. Transparency also lets
 * one render sit on either theme's ground.
 */

const UNITS = 120;            // motif spans ~100 units
const PAPER = "#faf8f2";
const PAPER_RGB = [0xfa, 0xf8, 0xf2];

const COLORS = {
  gold: "#C5A059",
  rose: "#B97D78",
  crimson: "#991F25",
  ink: "#4a3c31",
};

/* Key the paper out. For pigment over a known ground C = a·F + (1-a)·P, which
   is one equation in two unknowns — but coverage is well approximated by how
   far the pixel darkens the ground, and the pigment then follows:
       a = 1 - min(C/P)        F = (C - (1-a)·P) / a
   Recovering the two separately keeps soft dabs soft, where a colour-key
   threshold would give a hard cutout. */
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
    let sketch = null;
    let stage = null;
    let disposed = false;

    const paint = async () => {
      if (disposed || !hostRef.current) return;
      try {
        const p5mod = await import("p5");
        if (disposed) return;
        const P5 = p5mod.default || p5mod;
        window.p5 = P5;                 // p5.brush reaches for the global

        const brushMod = await import("p5.brush");
        if (disposed || !hostRef.current) return;
        const brush = brushMod.brush || brushMod.default || window.brush;
        if (!brush || typeof brush.scaleBrushes !== "function") return;

        // The canvas actually shown: receives the keyed, transparent copy.
        const display = document.createElement("canvas");
        display.width = UNITS;
        display.height = UNITS;
        hostRef.current.replaceChildren(display);

        // p5 paints on opaque paper in its own canvas, parked offscreen and
        // never shown.
        stage = document.createElement("div");
        stage.setAttribute("aria-hidden", "true");
        stage.style.cssText =
          "position:absolute;left:-99999px;top:0;width:0;height:0;overflow:hidden";
        document.body.appendChild(stage);

        sketch = new P5(makeSketch(brush, display), stage);
      } catch (_) {
        /* decorative: if it cannot load, the page is unaffected */
      }
    };

    paint();

    return () => {
      disposed = true;
      if (sketch) {
        try {
          sketch.remove();
        } catch (_) {
          /* already torn down */
        }
      }
      if (stage) stage.remove();
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
