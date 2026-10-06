/* The post ornaments: ten small emblems, one per post number, each built
 * from exactly n of its principal element — one sparkle, two lobes, three
 * discs, and so on up to ten rays — so the number is there to be counted
 * without being written.
 *
 * Build-time only, rendered by render-art.mjs with the hibiscus's engine,
 * seeding and keying; every note at the top of flower-sketch.js applies here
 * too. Painted in its hand as well: textured fills, a little hatching on the
 * principal shapes, and the paper showing through where a shape is cut out.
 * The palette is mid-century folk — blue, terracotta, mustard, orange, olive,
 * brown — taken a step quieter than poster colours so it sits on the ivory.
 */

(function () {
  const UNITS = 120;
  const SEED = 20260905;

  /* Dark mode lifts every colour: the keying measures how far paint LIGHTENS
     the charcoal (see flower-sketch.js), so each must be lighter than the
     ground in every channel that matters. Painting in the ground's own colour
     cuts a hole — the "paper" of the cut-outs. */
  const THEMES = {
    light: {
      ground: "#faf8f2",
      groundRGB: [0xfa, 0xf8, 0xf2],
      direction: "darken",
      blue: "#3f6fb5",
      red: "#c8463a",
      mustard: "#dfa83a",
      orange: "#e5853a",
      olive: "#74883a",
      brown: "#8a5a2e",
      ink: "#4a3c31",
    },
    dark: {
      ground: "#1e1f21",
      groundRGB: [0x1e, 0x1f, 0x21],
      direction: "lighten",
      blue: "#79a2e2",
      red: "#e3776a",
      mustard: "#f1c965",
      orange: "#f2a160",
      olive: "#a9bd66",
      brown: "#c99360",
      ink: "#f2dfb2",
    },
  };

  // Identical to flower-sketch.js, except for the crop: see below.
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

    /* Every ornament keeps the full canvas, centred on the canvas rather than
       on its own paint: a tight crop would scale each differently once CSS
       sizes them alike, and the nine small dots would come out as large as
       the sun. */
    const bbox = maxX < 0 ? null : { w: maxX - minX + 1, h: maxY - minY + 1, size: UNITS };
    return { canvas: c, bbox };
  }

  /* ----- Geometry: everything is a point list, centred on the origin ----- */

  const rad = (deg) => (deg * Math.PI) / 180;
  const polar = (r, deg, cx = 0, cy = 0) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];

  const circle = (cx, cy, r, steps = 28) =>
    Array.from({ length: steps }, (_, i) => polar(r, (360 * i) / steps, cx, cy));

  /* A four-point sparkle: tips joined by curves bowed in toward the centre,
     the concave star of the references. `pull` is how deep the bow goes. */
  function sparkle(cx, cy, R, pull = 0.72, rot = -90, tips = 4) {
    const pts = [];
    for (let i = 0; i < tips; i++) {
      const a = polar(R, rot + (360 * i) / tips);
      const b = polar(R, rot + (360 * (i + 1)) / tips);
      for (let s = 0; s < 8; s++) {
        const t = s / 8;
        const f = 1 - pull * Math.sin(Math.PI * t);
        pts.push([cx + f * (a[0] + (b[0] - a[0]) * t), cy + f * (a[1] + (b[1] - a[1]) * t)]);
      }
    }
    return pts;
  }

  // A straight-sided star: n points, alternating outer and inner radius.
  const star = (n, R, r, rot = -90) =>
    Array.from({ length: n * 2 }, (_, i) => polar(i % 2 ? r : R, rot + (180 * i) / n));

  /* A teardrop pointing at the centre: a narrow tip at r0, swelling to a
     round bulb of radius w whose far edge sits at r1. */
  function teardrop(deg, r0, r1, w) {
    const [bx, by] = polar(r1 - w, deg);
    const pts = [polar(r0, deg)];
    for (let a = -115; a <= 115; a += 15) pts.push(polar(w, deg + 180 + a + 180, bx, by));
    return pts;
  }

  // A tapering ray from r0 to r1, w0 wide at the root and w1 at the tip.
  function ray(deg, r0, r1, w0, w1) {
    const [x0, y0] = polar(r0, deg);
    const [x1, y1] = polar(r1, deg);
    const [nx, ny] = polar(1, deg + 90);
    return [
      [x0 + nx * w0, y0 + ny * w0],
      [x1 + nx * w1, y1 + ny * w1],
      [x1 - nx * w1, y1 - ny * w1],
      [x0 - nx * w0, y0 - ny * w0],
    ];
  }

  /* A lens: the overlap of two circles of radius r whose centres are d
     apart along x. */
  function lens(d, r) {
    const half = Math.acos(d / 2 / r) * (180 / Math.PI);
    const pts = [];
    for (let a = -half; a <= half; a += half / 6) pts.push(polar(r, a, -d / 2));
    for (let a = 180 - half; a <= 180 + half; a += half / 6) pts.push(polar(r, a, d / 2));
    return pts;
  }

  /* ----- Painting ----- */

  /* Fills a point list in the petals' manner. With `hatch`, the shape also
     takes a light hatching at that angle in the theme's ink, where a petal
     carries its shading. */
  function paint(brush, t, pts, color, opts = {}) {
    brush.noStroke();
    brush.fill(color, opts.alpha ?? 225);
    brush.fillTexture(0.5, 0.35);
    brush.bleed(opts.bleed ?? 0.035);
    if (opts.hatch !== undefined) {
      brush.setHatch("HB", t.ink, 0.35);
      brush.hatch(2.6, opts.hatch, { rand: 0.25 });
    }
    brush.beginShape(0);
    for (const [x, y] of pts) brush.vertex(x, y);
    brush.endShape(true);
    if (opts.hatch !== undefined) brush.noHatch();
  }

  // Paints in the ground's own colour, which the keying turns into a hole.
  const cut = (brush, t, pts) => paint(brush, t, pts, t.ground, { alpha: 255, bleed: 0.01 });

  const ORNAMENTS = {
    // One sparkle, cut from a blue disc.
    1(b, t) {
      paint(b, t, circle(0, 0, 48), t.blue, { hatch: 35 });
      cut(b, t, sparkle(0, 0, 40, 0.74));
      paint(b, t, circle(0, 0, 5.5), t.mustard);
    },
    // Two lobes, with the lens where they overlap cut away.
    2(b, t) {
      paint(b, t, circle(-17, 0, 30), t.red, { hatch: 40 });
      paint(b, t, circle(17, 0, 30), t.red, { hatch: -40 });
      cut(b, t, lens(34, 30));
      paint(b, t, circle(-28, 0, 5), t.mustard);
      paint(b, t, circle(28, 0, 5), t.mustard);
    },
    // Three discs in a trefoil, three dots between them.
    3(b, t) {
      for (let i = 0; i < 3; i++) {
        const [x, y] = polar(21, -90 + i * 120);
        paint(b, t, circle(x, y, 21), t.mustard, { hatch: 30 + i * 60 });
      }
      cut(b, t, sparkle(0, 0, 14, 0.7, -90, 3));
      for (let i = 0; i < 3; i++) {
        const [x, y] = polar(45, 90 + i * 120);
        paint(b, t, circle(x, y, 5), t.orange);
      }
    },
    // Four circles, quatrefoil, a sparkle at the heart.
    4(b, t) {
      for (let i = 0; i < 4; i++) {
        const [x, y] = polar(21, 45 + i * 90);
        paint(b, t, circle(x, y, 22), t.red, { hatch: 45 + i * 90 });
      }
      paint(b, t, sparkle(0, 0, 21, 0.7), t.mustard);
    },
    // Five teardrop spokes.
    5(b, t) {
      for (let i = 0; i < 5; i++) {
        paint(b, t, teardrop(-90 + i * 72, 9, 49, 11), t.olive, { hatch: -90 + i * 72 });
      }
      paint(b, t, circle(0, 0, 8), t.orange);
    },
    // Six dots ringing a bullseye.
    6(b, t) {
      for (let i = 0; i < 6; i++) {
        const [x, y] = polar(39, -90 + i * 60);
        paint(b, t, circle(x, y, 9), t.blue, { hatch: 45 });
      }
      paint(b, t, circle(0, 0, 17), t.blue);
      cut(b, t, circle(0, 0, 11.5));
      paint(b, t, circle(0, 0, 6.5), t.orange);
    },
    // Seven rays cut from a sun.
    7(b, t) {
      paint(b, t, circle(0, 0, 48), t.orange, { hatch: 20 });
      for (let i = 0; i < 7; i++) cut(b, t, ray(-90 + (i * 360) / 7, 13, 44, 2, 6.5));
      paint(b, t, circle(0, 0, 9), t.mustard);
    },
    // An eight-point compass star cut from a blue disc.
    8(b, t) {
      paint(b, t, circle(0, 0, 48), t.blue, { hatch: -30 });
      cut(b, t, star(8, 42, 15, -90).map(([x, y], i) => (i % 4 === 2 ? [x * 0.72, y * 0.72] : [x, y])));
      paint(b, t, circle(0, 0, 7), t.red);
    },
    // Nine dots on a three-by-three grid, each with a pale eye.
    9(b, t) {
      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          const centre = r === 0 && c === 0;
          paint(b, t, circle(c * 31, r * 31, centre ? 13 : 11), centre ? t.red : t.orange, { hatch: 45 });
          cut(b, t, circle(c * 31, r * 31, centre ? 5 : 4));
        }
      }
    },
    // Ten tapering rays around a centre.
    10(b, t) {
      for (let i = 0; i < 10; i++) paint(b, t, ray(-90 + i * 36, 15, 50, 2.2, 5.5), t.brown);
      paint(b, t, circle(0, 0, 13), t.brown, { hatch: 45 });
      paint(b, t, circle(0, 0, 6), t.mustard);
    },
  };

  /* Renders ornament n (1–10) in one theme and resolves with { dataURL, bbox }. */
  window.renderOrnament = function (n, key) {
    return new Promise(function (resolve, reject) {
      const t = THEMES[key];
      if (!t) return reject(new Error("unknown theme " + key));
      if (!ORNAMENTS[n]) return reject(new Error("no ornament for " + n));

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
          // Seeded per ornament: each has its own grain, but the same
          // ornament always renders the same.
          p.randomSeed(SEED + n);
          p.noiseSeed(SEED + n);
          if (typeof brush.seed === "function") brush.seed(SEED + n);
          /* scaleBrushes multiplies the library's GLOBAL brush sizes, so it
             runs once per page: called per ornament it compounded 3x, 9x,
             27x until strokes painted as blobs and then vanished. */
          if (!window.__ornamentBrushesScaled) {
            brush.scaleBrushes(3);
            window.__ornamentBrushesScaled = true;
          }
          p.angleMode(p.DEGREES);
          p.noLoop();
        };
        p.draw = function () {
          try {
            p.background(t.ground);
            ORNAMENTS[n](brush, t);
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
