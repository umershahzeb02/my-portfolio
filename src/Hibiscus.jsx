import { useEffect, useRef } from "react";

/* The hibiscus, painted live by p5.brush.
 *
 * Vector filters could rough an outline and mottle a fill, but not reproduce
 * hundreds of dabs accumulating into a stroke, and that is where the character
 * lives. So the sketch runs for real. p5 and p5.brush come in through dynamic
 * import() from an effect after first paint: they sit in their own chunks and
 * nothing about the page render waits on them.
 *
 * Five things the sketch needs that are not obvious, each of which produced a
 * visibly wrong render before it was found:
 *
 *   1. p5.brush 1.1.4, not 2.x — 2.x dropped scaleBrushes.
 *   2. hatchStyle -> setHatch, fillBleed -> bleed. Those are the 1.1.4 names.
 *   3. Transforms must go through brush.push/rotate/pop. The library keeps its
 *      own transform stack; p5's globals leave all five petals stacked rather
 *      than radiating — it measured 98x154 instead of square.
 *   4. pixelDensity(1). Brushes are sized in DEVICE pixels, so on retina every
 *      stroke doubles in weight against unchanged geometry.
 *   5. An OPAQUE ground. "Transparent" is transparent BLACK, and the engine
 *      builds its look from semi-transparent dabs, so on a clear canvas each
 *      blends toward black: pixels below alpha 160 measured luminance 2/255.
 *
 * Because of (5) it paints on an opaque ground and the ground is keyed out
 * afterwards, so the visible canvas carries real alpha. That transparency is
 * also what stops a hard square edge appearing when the cursor wash passes
 * behind it — the wash is at z-index 0 and the sidebar at 10, so an opaque
 * tile could never receive it.
 */

const UNITS = 120;          // motif spans ~100 units

/* One fixed seed for everything random in the sketch. Without it the flower is
   redrawn differently on every load and on every theme toggle, which is
   distracting in something sitting behind the name. brush.seed covers the
   engine's own jitter — the bleed, the hatch offsets, the fill texture —
   while randomSeed covers the stipple placement. */
const SEED = 20260905;

/* Each theme paints on its own ground, and the key runs in the direction the
   pigment actually contrasts.
 *
 * The light palette is ink on paper: pigment darkens the ground.
 * The dark palette is gold on charcoal: pigment LIGHTENS it. Reusing the light
 * maths there would compute near-zero coverage for every stroke and key the
 * whole flower away, because it measures how far a pixel darkens the ground
 * and these strokes never do. Every dark-mode colour must therefore be lighter
 * than the ground it is painted on. */
const THEMES = {
  light: {
    ground: "#faf8f2",
    groundRGB: [0xfa, 0xf8, 0xf2],
    direction: "darken",
    petal: "#B97D78",   // rose
    hatch: "#991F25",   // crimson
    stamen: "#C5A059",  // gold
    midrib: "#4a3c31",  // ink
  },
  dark: {
    ground: "#1e1f21",
    groundRGB: [0x1e, 0x1f, 0x21],
    direction: "lighten",
    petal: "#caa262",   // gold
    hatch: "#e2b978",   // amber, standing in for the crimson accent
    stamen: "#f2dfb2",  // pale gold
    midrib: "#9c9078",  // warm light line; the ink brown would vanish here
  },
};

/* Key the ground out.
 *
 * Over a known ground, C = a·F + (1-a)·P — one equation in two unknowns. But
 * coverage is well approximated by how far the pixel moves the ground toward
 * the pigment, and the pigment then follows. Recovering the two separately is
 * what keeps soft dabs soft, where a colour-key threshold gives a hard cutout.
 *
 *   darken   a = 1 - min(C/P)                 ink on paper
 *   lighten  a = max((C-P)/(255-P))           gold on charcoal
 *
 * and in both cases  F = (C - (1-a)·P) / a.
 */
function keyOutGround(src, dst, P, direction) {
  const w = dst.width;
  const h = dst.height;
  const ctx = dst.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(src, 0, 0, w, h);

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const lighten = direction === "lighten";

  for (let i = 0; i < d.length; i += 4) {
    let a;
    if (lighten) {
      a = 0;
      for (let c = 0; c < 3; c++) {
        const denom = 255 - P[c];
        if (denom > 0) {
          const v = (d[i + c] - P[c]) / denom;
          if (v > a) a = v;
        }
      }
    } else {
      a = 1 - Math.min(d[i] / P[0], d[i + 1] / P[1], d[i + 2] / P[2]);
    }

    if (a <= 0.004) {
      d[i + 3] = 0;
      continue;
    }
    if (a > 1) a = 1;

    const inv = 1 - a;
    for (let c = 0; c < 3; c++) {
      const v = (d[i + c] - inv * P[c]) / a;
      d[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
    d[i + 3] = Math.round(a * 255);
  }
  ctx.putImageData(img, 0, 0);
}

function makeSketch(brush, display, theme) {
  return (p) => {
    p.setup = () => {
      p.createCanvas(UNITS, UNITS, p.WEBGL);
      p.pixelDensity(1);
      if (typeof brush.instance === "function") brush.instance(p);
      if (typeof brush.load === "function") brush.load();
      // Seed before anything draws, so the render is identical every time.
      p.randomSeed(SEED);
      p.noiseSeed(SEED);
      if (typeof brush.seed === "function") brush.seed(SEED);
      brush.scaleBrushes(3);
      p.angleMode(p.DEGREES);
      p.noLoop();
    };

    p.draw = () => {
      p.background(theme.ground);
      drawMotif(p, brush, theme);
      keyOutGround(p.canvas, display, theme.groundRGB, theme.direction);
    };
  };
}

function drawMotif(p, brush, t) {
  for (let k = 0; k < 5; k++) drawPetal(p, brush, k, t);

  brush.push();
  brush.rotate(-15);
  brush.set("HB", t.stamen, 0.8);
  brush.line(0, 0, 0, -35);
  brush.fill(t.stamen, 200);
  for (let m = 0; m < 5; m++) {
    brush.circle(p.random(-4, 4), -35 + p.random(-5, 5), p.random(2, 4), 0.1);
  }
  brush.pop();
}

function drawPetal(p, brush, k, t) {
  brush.push();
  brush.rotate(k * 72);

  brush.fill(t.petal, 140);
  brush.fillTexture(0.6, 0.4);
  brush.noStroke();
  brush.beginShape(0.6);
  brush.vertex(0, 0);
  brush.vertex(15, -35);
  brush.vertex(0, -50);
  brush.vertex(-15, -35);
  brush.endShape(true);

  brush.setHatch("HB", t.hatch, 0.5);
  brush.hatch(1.5, 90, { rand: 0.2 });
  brush.beginShape(0.5);
  brush.vertex(0, -5);
  brush.vertex(8, -20);
  brush.vertex(0, -25);
  brush.vertex(-8, -20);
  brush.endShape(true);
  brush.noHatch();

  brush.set("pen", t.midrib, 0.4);
  brush.line(0, -5, 0, -40);
  brush.pop();
}

export default function Hibiscus({ className = "" }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    let sketch = null;
    let stage = null;
    let painted = null;      // which theme is currently on screen
    let disposed = false;

    const teardown = () => {
      if (sketch) {
        try {
          sketch.remove();
        } catch (_) {
          /* already torn down */
        }
        sketch = null;
      }
      if (stage) {
        stage.remove();
        stage = null;
      }
      painted = null;
    };

    const paint = async (key) => {
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

        teardown();

        // The canvas actually shown: receives the keyed, transparent copy.
        const display = document.createElement("canvas");
        display.width = UNITS;
        display.height = UNITS;
        hostRef.current.replaceChildren(display);

        // p5 paints on the opaque ground in its own canvas, parked offscreen
        // and never shown.
        stage = document.createElement("div");
        stage.setAttribute("aria-hidden", "true");
        stage.style.cssText =
          "position:absolute;left:-99999px;top:0;width:0;height:0;overflow:hidden";
        document.body.appendChild(stage);

        sketch = new P5(makeSketch(brush, display, THEMES[key]), stage);
        painted = key;
      } catch (_) {
        /* decorative: if it cannot load, the page is unaffected */
      }
    };

    const sync = () => {
      const key = root.dataset.theme === "dark" ? "dark" : "light";
      if (key !== painted) paint(key);
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
