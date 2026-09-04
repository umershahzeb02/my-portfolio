/* The hibiscus sketch. Build-time only — it never ships to the browser.
 *
 * Plain browser globals rather than a module, because the render harness loads
 * it with a <script> tag alongside p5 and p5.brush, with no bundler involved.
 * This is the ONLY copy: the app itself just serves the PNGs this produces, so
 * there is nothing to keep in sync.
 *
 * Five things the sketch needs that are not obvious, each of which produced a
 * visibly wrong render before it was found:
 *
 *   1. p5.brush 1.1.4, not 2.x — 2.x dropped scaleBrushes.
 *   2. hatchStyle -> setHatch, fillBleed -> bleed. Those are the 1.1.4 names.
 *   3. Transforms must go through brush.push/rotate/pop. The library keeps its
 *      own transform stack; p5's globals leave all five petals stacked rather
 *      than radiating — it measured 98x154 instead of square.
 *   4. pixelDensity(1). Brushes are sized in DEVICE pixels, so at any other
 *      density every stroke changes weight against unchanged geometry.
 *   5. An OPAQUE ground. "Transparent" is transparent BLACK, and the engine
 *      builds its look from semi-transparent dabs, so on a clear canvas each
 *      blends toward black: pixels below alpha 160 measured luminance 2/255.
 */

(function () {
  const UNITS = 120; // motif spans ~100 units

  /* Fixed seed so the render is reproducible: re-running the build must not
     quietly change the artwork. brush.seed covers the engine's own jitter —
     bleed, hatch offsets, fill texture — while randomSeed covers the stipple. */
  const SEED = 20260905;

  /* Each theme paints on its own ground and is keyed in the direction its
     pigment actually contrasts. Light is ink darkening paper; dark is gold
     LIGHTENING charcoal. Using the light maths on gold would measure how far
     each pixel darkens the ground, find almost nothing, and key the whole
     flower away — so every dark colour must be lighter than its ground. */
  const THEMES = {
    light: {
      ground: "#faf8f2",
      groundRGB: [0xfa, 0xf8, 0xf2],
      direction: "darken",
      petal: "#B97D78",
      hatch: "#991F25",
      stamen: "#C5A059",
      midrib: "#4a3c31",
    },
    dark: {
      ground: "#1e1f21",
      groundRGB: [0x1e, 0x1f, 0x21],
      direction: "lighten",
      petal: "#caa262",
      hatch: "#e2b978",
      stamen: "#f2dfb2",
      midrib: "#9c9078",
    },
  };

  /* Key the ground out. Over a known ground C = a*F + (1-a)*P, one equation in
     two unknowns — but coverage is well approximated by how far the pixel moves
     the ground toward the pigment, and the pigment then follows:

       darken    a = 1 - min(C/P)
       lighten   a = max((C-P)/(255-P))
       both      F = (C - (1-a)P) / a

     Recovering coverage and pigment separately keeps soft dabs soft; a
     colour-key threshold would give a hard cutout. Also returns the painted
     bounding box so the result can be cropped tight. */
  function keyAndCrop(src, P, direction) {
    const w = src.width;
    const h = src.height;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(src, 0, 0);

    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const lighten = direction === "lighten";
    let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        let a;
        if (lighten) {
          a = 0;
          for (let k = 0; k < 3; k++) {
            const denom = 255 - P[k];
            if (denom > 0) {
              const v = (d[i + k] - P[k]) / denom;
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
        for (let k = 0; k < 3; k++) {
          const v = (d[i + k] - inv * P[k]) / a;
          d[i + k] = v < 0 ? 0 : v > 255 ? 255 : v;
        }
        d[i + 3] = Math.round(a * 255);

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    ctx.putImageData(img, 0, 0);

    if (maxX < 0) return { canvas: c, bbox: null };

    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const cx = minX + bw / 2;
    const cy = minY + bh / 2;
    const half = Math.ceil(Math.max(bw, bh) / 2) + 4;
    const size = half * 2;

    const out = document.createElement("canvas");
    out.width = size;
    out.height = size;
    out.getContext("2d").drawImage(c, cx - half, cy - half, size, size, 0, 0, size, size);
    return { canvas: out, bbox: { w: bw, h: bh, size: size } };
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

  /* Renders one theme and resolves with { dataURL, bbox }. */
  window.renderFlower = function (key) {
    return new Promise(function (resolve, reject) {
      const t = THEMES[key];
      if (!t) return reject(new Error("unknown theme " + key));

      const stage = document.createElement("div");
      stage.style.cssText =
        "position:absolute;left:-99999px;top:0;width:0;height:0;overflow:hidden";
      document.body.appendChild(stage);

      const sketch = function (p) {
        p.setup = function () {
          p.createCanvas(UNITS, UNITS, p.WEBGL);
          p.pixelDensity(1);
          if (typeof brush.instance === "function") brush.instance(p);
          if (typeof brush.load === "function") brush.load();
          p.randomSeed(SEED);
          p.noiseSeed(SEED);
          if (typeof brush.seed === "function") brush.seed(SEED);
          brush.scaleBrushes(3);
          p.angleMode(p.DEGREES);
          p.noLoop();
        };
        p.draw = function () {
          try {
            p.background(t.ground);
            drawMotif(p, brush, t);
            const r = keyAndCrop(p.canvas, t.groundRGB, t.direction);
            resolve({ dataURL: r.canvas.toDataURL("image/png"), bbox: r.bbox });
          } catch (e) {
            reject(e);
          } finally {
            setTimeout(function () {
              try { inst.remove(); } catch (_) {}
              stage.remove();
            }, 0);
          }
        };
      };

      const inst = new p5(sketch, stage);
    });
  };
})();
