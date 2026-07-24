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

/* One observer for the page. Elements opt in with .reveal and are unobserved
   once shown, so nothing keeps running after the first pass. */
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

// Highlights the nav row for whichever section is currently in view.
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
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  return active;
}

const Reveal = ({ delay = 0, className = "", as: Tag = "div", children }) => (
  <Tag className={`reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` }}>
    {children}
  </Tag>
);

const Arrow = () => (
  <svg
    className="inline-block size-3 shrink-0 translate-y-[-1px] transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:translate-y-[-3px]"
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
    className={`group/link inline-flex items-center gap-1 font-medium text-slate-200 transition-colors hover:text-teal-300 focus-visible:text-teal-300 ${className}`}
  >
    {children}
  </a>
);

const SectionHeading = ({ children }) => (
  <h2 className="sticky top-0 z-20 -mx-4 mb-5 w-screen bg-slate-900/80 px-4 py-4 font-mono text-xs uppercase tracking-[0.18em] text-slate-200 backdrop-blur-sm md:mx-0 md:w-auto md:px-0 md:py-0 md:bg-transparent md:backdrop-blur-none lg:sr-only">
    {children}
  </h2>
);

function Sidebar() {
  const active = useActiveSection();

  return (
    <div className="sidebar">
      <div className="flex h-full flex-col justify-between py-4 md:py-12 lg:pr-8">
        <div>
          <h1 className="text-[2.75rem] font-bold leading-[1.05] tracking-[-0.03em] text-slate-100 sm:text-6xl">
            {profile.name}
          </h1>
          <h2 className="mt-3 text-lg font-medium tracking-tight text-slate-200 sm:text-xl">
            {profile.role}
          </h2>
          <p className="mt-4 max-w-sm leading-relaxed text-slate-400">{profile.intro}</p>

          <nav className="mt-14 hidden lg:block" aria-label="Sections">
            <ul className="space-y-4">
              {NAV.map(([label, id]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={`nav-item group flex items-center gap-4 py-1 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
                      active === id
                        ? "active text-teal-300"
                        : "text-slate-500 hover:text-slate-200"
                    }`}
                  >
                    <span className="nav-line" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 lg:mt-0 lg:pb-12">
          <Socials />
        </div>
      </div>
    </div>
  );
}

function About() {
  return (
    <section id="about" className="scroll-mt-16 py-10 md:py-14" aria-label="About">
      <SectionHeading>About</SectionHeading>
      <Reveal className="space-y-4 leading-relaxed">
        {profile.about.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </Reveal>
    </section>
  );
}

function Experience() {
  return (
    <section id="experience" className="scroll-mt-16 py-10 md:py-14" aria-label="Experience">
      <SectionHeading>Experience</SectionHeading>

      <Reveal className="group relative rounded-lg p-4 transition-colors hover:bg-slate-800/40 lg:-mx-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className="font-semibold text-slate-200">
            {experience.role} <span className="text-slate-400">· {experience.orgShort}</span>
          </h3>
          <span className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-slate-500">
            {experience.period}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">{experience.note}</p>

        <ul className="mt-5 space-y-5">
          {experience.projects.map((p) => (
            <li key={p.name} className="border-l border-slate-700/70 pl-4">
              <h4 className="font-medium text-slate-200">
                {p.href ? (
                  <Out href={p.href}>
                    {p.name} <Arrow />
                  </Out>
                ) : (
                  <>
                    {p.name} <span className="font-normal text-slate-500">(internal)</span>
                  </>
                )}
              </h4>
              <p className="mt-1.5 leading-relaxed text-slate-400">{p.text}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="mt-10" delay={60}>
        <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-slate-500">
          Education
        </h3>
        <ul className="mt-4 space-y-2">
          {education.map((e) => (
            <li key={e.school} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
              <span>
                <span className="font-medium text-slate-200">{e.detail}</span>
                <span className="text-slate-400"> — {e.school}</span>
              </span>
              <span className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-slate-500">
                {e.period}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="mt-10" delay={90}>
        <a
          href={links.resume}
          target="_blank"
          rel="noreferrer noopener"
          className="group/link inline-flex items-center gap-1.5 font-medium text-slate-200 transition-colors hover:text-teal-300"
        >
          View full résumé <Arrow />
        </a>
      </Reveal>
    </section>
  );
}

function Projects() {
  return (
    <section id="projects" className="scroll-mt-16 py-10 md:py-14" aria-label="Projects">
      <SectionHeading>Projects</SectionHeading>

      <ul className="space-y-3">
        {work.map((p, i) => (
          <Reveal as="li" key={p.title} delay={i * 60}>
            <div className="group relative rounded-lg p-4 transition-colors hover:bg-slate-800/40 lg:-mx-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="font-semibold text-slate-200 transition-colors group-hover:text-teal-300">
                  {p.title}
                </h3>
                <span className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-slate-500">
                  {p.domain}
                </span>
              </div>

              <p className="mt-2 leading-relaxed">{p.summary}</p>
              {p.detail && <p className="mt-2 leading-relaxed text-slate-500">{p.detail}</p>}

              <ul className="mt-3 flex flex-wrap gap-2">
                {p.stack.map((s) => (
                  <li
                    key={s}
                    className="rounded-full bg-teal-400/10 px-3 py-1 font-mono text-[0.6875rem] leading-5 text-teal-300"
                  >
                    {s}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                {p.links.map((l) => (
                  <Out key={l.href} href={l.href}>
                    {l.label} <Arrow />
                  </Out>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </ul>

      <Reveal className="mt-6 px-4 lg:px-0" delay={80}>
        <Out href={links.github}>
          All projects on GitHub <Arrow />
        </Out>
      </Reveal>
    </section>
  );
}

function Writing() {
  return (
    <section id="writing" className="scroll-mt-16 py-10 md:py-14" aria-label="Writing">
      <SectionHeading>Writing</SectionHeading>

      <Reveal className="mb-4 leading-relaxed">
        <p>
          On browser internals, automation, infrastructure and web architecture — at the{" "}
          <Out href="https://bumbletap.com/blog" className="!font-normal">
            BumbleTap engineering blog
          </Out>{" "}
          and on{" "}
          <Out href={links.medium} className="!font-normal">
            Medium
          </Out>
          .
        </p>
      </Reveal>

      <ul className="space-y-2">
        {writing.map((a, i) => (
          <Reveal as="li" key={a.href} delay={i * 60}>
            <a
              href={a.href}
              target="_blank"
              rel="noreferrer noopener"
              className="group/link block rounded-lg p-4 transition-colors hover:bg-slate-800/40 lg:-mx-4"
            >
              <h3 className="font-semibold text-slate-200 transition-colors group-hover/link:text-teal-300">
                {a.title} <Arrow />
              </h3>
              <p className="mt-1.5 leading-relaxed text-slate-400">{a.blurb}</p>
            </a>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function Stack() {
  return (
    <section className="py-10 md:py-14" aria-label="Stack">
      <SectionHeading>Stack</SectionHeading>
      <dl className="space-y-3">
        {stack.map((row, i) => (
          <Reveal key={row.label} delay={i * 40}>
            <div className="grid gap-0.5 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
              <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-slate-500 sm:pt-0.5">
                {row.label}
              </dt>
              <dd className="text-slate-400">{row.items}</dd>
            </div>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}

export default function App() {
  useReveal();

  return (
    <div className="min-h-screen bg-slate-900 leading-relaxed text-slate-400 antialiased selection:bg-teal-300 selection:text-teal-900">
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-teal-300 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-teal-900"
      >
        Skip to content
      </a>

      <div className="mx-auto flex w-full max-w-screen-xl flex-col px-6 md:flex-row md:px-12 lg:px-16">
        <div className="w-full p-4 md:w-1/2">
          <Sidebar />
        </div>
        <div className="w-full p-4 md:w-1/2">
          <main>
            <About />
            <Experience />
            <Projects />
            <Writing />
            <Stack />
          </main>
          <footer className="pb-16 pt-4 text-sm text-slate-500">
            <p>
              Built with React, Tailwind CSS and Vite. Deployed on GitHub Pages.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
