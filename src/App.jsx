import { useEffect, useState } from "react";
import {
  profile,
  links,
  work,
  experience,
  writing,
  stack,
  education,
} from "./data";
import Socials from "./Socials";

const NAV = [
  ["About", "about"],
  ["Experience", "experience"],
  ["Projects", "projects"],
  ["Writing", "writing"],
];

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

function useActiveSection() {
  const [active, setActive] = useState("about");
  useEffect(() => {
    const sections = NAV.map(([, id]) => document.getElementById(id)).filter(Boolean);
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
  }, []);
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

// Local time where he actually is, so "Islamabad" carries a bit of presence.
function useLocalTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const read = () =>
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Karachi",
      }).format(new Date());
    setTime(read());
    const id = setInterval(() => setTime(read()), 30000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/* Copying beats a mailto: for anyone not using a desktop mail client, which is
   most people. Falls back to mailto: where the clipboard is unavailable. */
function CopyEmail() {
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

const Reveal = ({ delay = 0, className = "", as: Tag = "div", children }) => (
  <Tag className={`reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` }}>
    {children}
  </Tag>
);

const Arrow = () => (
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

const Out = ({ href, children, className = "" }) => (
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
const SectionLabel = ({ index, children }) => (
  <Reveal className="mb-8 flex items-baseline gap-3">
    <span className="t-index text-teal-300/70">{index}</span>
    <span className="t-label text-slate-400">{children}</span>
  </Reveal>
);

function Sidebar() {
  const active = useActiveSection();
  const time = useLocalTime();

  return (
    <header className="sidebar py-12 lg:py-16">
      <div>
        <h1 className="t-display text-slate-100">{profile.name}</h1>
        <p className="t-role mt-4 text-teal-300">{profile.tagline}</p>
        <p className="t-body mt-5 max-w-xs text-slate-400">{profile.intro}</p>

        <div className="mt-6 flex items-center gap-2.5">
          <span className="status-dot" aria-hidden="true" />
          <p className="t-meta text-slate-500">
            Islamabad{time ? ` · ${time} local` : ""}
          </p>
        </div>

        <nav className="mt-12 hidden lg:block" aria-label="Sections">
          <ul className="space-y-4">
            {NAV.map(([label, id]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={active === id ? "true" : undefined}
                  className={`nav-item t-label ${
                    active === id
                      ? "is-active text-teal-300"
                      : "text-slate-500 hover:text-slate-200"
                  }`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-14 lg:mt-0">
        <CopyEmail />
        <div className="mt-6">
          <Socials />
        </div>
      </div>
    </header>
  );
}

function About() {
  const [lede, ...rest] = profile.about;
  return (
    <section id="about" className="scroll-mt-24 pb-24" aria-label="About">
      <SectionLabel index="01">About</SectionLabel>
      <Reveal>
        {/* The opening paragraph is set a step larger and lighter in colour, so
            the eye has an obvious entry point without a heading above it. */}
        <p className="t-lede text-slate-300">{lede}</p>
        <div className="t-body mt-5 space-y-5 text-slate-400">
          {rest.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function Experience() {
  return (
    <section id="experience" className="scroll-mt-24 pb-24" aria-label="Experience">
      <SectionLabel index="02">Experience</SectionLabel>

      <Reveal className="card -mx-4 p-4">
        <p className="t-meta text-slate-500">{experience.period}</p>
        {/* Role and employer share a line. items-baseline rather than items-center
            because the two sit at different sizes, and baselines are what the eye
            reads as level; centring would leave the smaller one floating. */}
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <h3 className="t-heading text-slate-100">{experience.role}</h3>
          {/* Muted so it separates without competing, and aria-hidden so screen
              readers do not announce "middle dot" between the two phrases. */}
          <span className="t-body text-slate-600" aria-hidden="true">·</span>
          <p className="t-body text-slate-300">{experience.orgShort}</p>
        </div>
        <p className="t-body mt-1 text-sm text-slate-500">{experience.note}</p>

        {/* Indented so the platforms sit beneath the role rather than beside it.
            Padding does the nesting on its own here, with no rule to lean on. */}
        <ul className="mt-6 space-y-5 pl-5 sm:pl-7">
          {experience.projects.map((p) => (
            <li key={p.name}>
              <h4 className="t-subheading text-slate-200">
                {p.href ? (
                  <Out href={p.href}>
                    {p.name} <Arrow />
                  </Out>
                ) : (
                  <>
                    {p.name}{" "}
                    <span className="t-meta align-middle text-slate-500">internal</span>
                  </>
                )}
              </h4>
              <p className="t-body mt-1.5 text-slate-400">{p.text}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="mt-12" delay={60}>
        <p className="t-label mb-5 text-slate-500">Education</p>
        <ul className="space-y-4">
          {education.map((e) => (
            <li key={e.school}>
              <p className="t-meta text-slate-500">{e.period}</p>
              <p className="t-heading mt-1 text-slate-200">{e.detail}</p>
              <p className="t-body text-slate-400">{e.school}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="mt-10" delay={90}>
        <Out href={links.resume} className="t-link">
          Full résumé <Arrow />
        </Out>
      </Reveal>
    </section>
  );
}

function Projects() {
  return (
    <section id="projects" className="scroll-mt-24 pb-24" aria-label="Projects">
      <SectionLabel index="03">Projects</SectionLabel>

      <ul className="space-y-4">
        {work.map((p, i) => (
          <Reveal as="li" key={p.title} delay={i * 60}>
            <div className="card group -mx-4 p-4">
              {/* Index and domain share a line above the title: the counter
                  gives rhythm down the list, the domain gives the category. */}
              <div className="flex items-baseline gap-3">
                <span className="t-index text-slate-600">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="t-label text-teal-300/80">{p.domain}</span>
              </div>

              <h3 className="t-heading mt-2 text-[1.1875rem] text-slate-100 transition-colors duration-300 group-hover:text-teal-300">
                {p.title}
              </h3>

              <p className="t-body mt-2 text-slate-400">{p.summary}</p>
              {p.detail && <p className="t-body mt-2 text-slate-500">{p.detail}</p>}

              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
                {p.stack.map((s) => (
                  <li key={s} className="t-meta text-teal-300/75">
                    {s}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {p.links.map((l) => (
                  <Out key={l.href} href={l.href} className="t-link">
                    {l.label} <Arrow />
                  </Out>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </ul>

      <Reveal className="mt-8 px-4 lg:px-0" delay={80}>
        <Out href={links.github} className="t-link">
          All projects <Arrow />
        </Out>
      </Reveal>
    </section>
  );
}

function Writing() {
  return (
    <section id="writing" className="scroll-mt-24 pb-24" aria-label="Writing">
      <SectionLabel index="04">Writing</SectionLabel>

      <Reveal className="t-body mb-6 text-slate-400">
        <p>
          On browser internals, automation, infrastructure and web architecture, at the{" "}
          <Out href="https://bumbletap.com/blog" className="!inline">
            BumbleTap engineering blog
          </Out>{" "}
          and on{" "}
          <Out href={links.medium} className="!inline">
            Medium
          </Out>
          .
        </p>
      </Reveal>

      <ul className="space-y-3">
        {writing.map((a, i) => (
          <Reveal as="li" key={a.href} delay={i * 60}>
            <a
              href={a.href}
              target="_blank"
              rel="noreferrer noopener"
              className="card group/link -mx-4 block p-4"
            >
              <h3 className="t-heading text-slate-100 transition-colors duration-300 group-hover/link:text-teal-300">
                {a.title} <Arrow />
              </h3>
              <p className="t-body mt-1.5 text-slate-400">{a.blurb}</p>
            </a>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function Stack() {
  return (
    <section className="pb-24" aria-label="Stack">
      <SectionLabel index="05">Stack</SectionLabel>
      <dl className="space-y-5">
        {stack.map((row, i) => (
          <Reveal key={row.label} delay={i * 40}>
            <dt className="t-label text-slate-500">{row.label}</dt>
            <dd className="t-body mt-1 text-slate-400">{row.items}</dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}

export default function App() {
  useReveal();
  useSpotlight();

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-400 antialiased">
      <div id="spotlight" className="spotlight" aria-hidden="true" />
      <a
        href="#about"
        className="t-label sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-50 focus:rounded focus:bg-teal-300 focus:px-3 focus:py-2 focus:text-teal-900"
      >
        Skip to content
      </a>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-x-16 px-6 sm:px-10 lg:grid-cols-2 lg:px-16">
        <Sidebar />
        <main className="pt-4 lg:py-20">
          <About />
          <Experience />
          <Projects />
          <Writing />
          <Stack />
          <footer className="t-meta pb-16 text-slate-600">
            <p>Built with React, Tailwind CSS and Vite. Deployed on GitHub Pages.</p>
          </footer>
        </main>
      </div>

      <ToTop />
    </div>
  );
}
