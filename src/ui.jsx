/* The pieces every page shares: the frame, the theme and scroll controls, and
   the small marks (arrows, links, labels) the design is built from. Each page
   composes these, so the blog reads as the same site. */
import { useEffect, useState } from "react";
import { profile } from "./data";

/* Internal links go through this so they carry the Pages base path. */
export const href = (path = "") => import.meta.env.BASE_URL + path;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/* By hand, not toLocaleDateString: the server and the browser can disagree on
   locale, and a date that renders differently on each breaks hydration. */
export const formatDate = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
};

function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
}

/* Which of the given element ids is currently being read — the home page's
   sections, or a post's headings. */
export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join(" ");
  useEffect(() => {
    const sections = key
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!sections.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [key]);
  return active;
}

/* Pointer-tracked wash behind the content. Skipped entirely for coarse
   pointers, where there is no cursor to follow, and for reduced motion.
   Writes go through rAF so a fast mouse cannot outpace the paint. */
function useSpotlight() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = document.getElementById("spotlight");
    if (!el) return;
    let raf = 0;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", `${e.clientX}px`);
        el.style.setProperty("--my", `${e.clientY}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
}

/* Copying beats a mailto: for anyone not using a desktop mail client, which is
   most people. Falls back to mailto: where the clipboard is unavailable. */
export function CopyEmail() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="t-link text-left text-slate-300 transition-colors duration-300 hover:text-teal-300"
    >
      <span aria-live="polite">{copied ? "Copied to clipboard" : profile.email}</span>
    </button>
  );
}

/* The theme lives on <html data-theme>, set by index.html before first paint
   so the page never flashes the wrong one. Pages are rendered ahead of time,
   when no theme is known, so the markup carries both icons and the stylesheet
   shows the right one; the label catches up once the page is live. */
function ThemeToggle() {
  const [dark, setDark] = useState(null);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);
  const toggle = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    /* Nearly every element carries a colour transition, and a theme flip
       would fire all of them at once, smearing the page from one palette to
       the other. They are switched off for the swap: the reflow commits the
       new colours while the rule holds, and it is lifted on the next frame.
       The toggle's own icons are spared, so their cross-fade still plays. */
    const freeze = document.createElement("style");
    freeze.textContent =
      "*:not(.theme-toggle > svg),*::before,*::after{transition:none !important}";
    document.head.append(freeze);
    document.documentElement.dataset.theme = next;
    void document.body.offsetHeight;
    requestAnimationFrame(() => freeze.remove());
    /* Defined by the pre-paint script in index.html, so the favicon is already
       correct on first load and this only has to keep up with the toggle. */
    if (typeof window.__setFavicon === "function") {
      window.__setFavicon(next === "dark");
    }
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private mode — the choice just will not survive a reload */
    }
    setDark(next === "dark");
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        dark === null ? "Toggle theme" : dark ? "Switch to light theme" : "Switch to dark theme"
      }
      className="theme-toggle bg-slate-800/70 text-slate-300 backdrop-blur hover:bg-teal-300 hover:text-teal-900"
    >
      <svg className="icon-sun" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
      </svg>
      <svg className="icon-moon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function ToTop() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`to-top bg-slate-800/80 text-slate-300 backdrop-blur hover:bg-teal-300 hover:text-teal-900 ${
        shown ? "is-shown" : ""
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export const Reveal = ({ delay = 0, className = "", as: Tag = "div", style, children, ...rest }) => (
  <Tag className={`reveal ${className}`} style={{ "--reveal-delay": `${delay}ms`, ...style }} {...rest}>
    {children}
  </Tag>
);

export const Arrow = () => (
  <svg
    className="arrow inline-block size-3 shrink-0 translate-y-[-1px]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    aria-hidden="true"
  >
    <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Out = ({ href, children, className = "" }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer noopener"
    className={`group/link inline-flex items-center gap-1.5 text-slate-200 transition-colors duration-300 hover:text-teal-300 focus-visible:text-teal-300 ${className}`}
  >
    {children}
  </a>
);

/* Section label. Numbered so the sections read as a sequence — the counter
   supplies the structure a horizontal rule would otherwise carry. */
/* A real heading. These read as the section titles, but were spans, so the
   outline ran h1 straight to the h3 project titles with nothing in between. The
   visual treatment is unchanged — the size still comes from .t-label, per the
   rule that heading level is a semantic choice and size is a separate one. The
   counter is decorative and hidden from assistive tech, which would otherwise
   announce "01 About". */
export const SectionLabel = ({ index, children }) => (
  <Reveal as="h2" className="mb-8 flex items-baseline gap-3">
    <span className="t-index text-teal-300/70" aria-hidden="true">{index}</span>
    <span className="t-label text-slate-400">{children}</span>
  </Reveal>
);

/* The home page splits into a sticky sidebar and a scrolling column; the blog
   is one centred column, set for reading. */
const LAYOUTS = {
  split: "grid gap-x-16 max-w-6xl px-6 sm:px-10 lg:grid-cols-2 lg:px-16",
  column: "max-w-2xl px-6 sm:px-8",
};

export function Shell({ skipTo, layout = "split", children }) {
  useReveal();
  useSpotlight();

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-400 antialiased">
      <div id="spotlight" className="spotlight" aria-hidden="true" />
      <a
        href={`#${skipTo}`}
        className="t-label sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-50 focus:rounded focus:bg-teal-300 focus:px-3 focus:py-2 focus:text-teal-900"
      >
        Skip to content
      </a>

      <div className={`relative z-10 mx-auto w-full ${LAYOUTS[layout]}`}>
        {children}
      </div>

      <ThemeToggle />
      <ToTop />
    </div>
  );
}
