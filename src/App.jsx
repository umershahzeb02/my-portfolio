import { useEffect, useRef, useState } from "react";
import {
  profile,
  links,
  work,
  experience,
  writing,
  stack,
  education,
} from "./data";

/* One observer for the whole page rather than one per element. Elements opt in
   by carrying .reveal; the observer unobserves after firing, so nothing keeps
   running once an item has appeared. */
function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
}

const Reveal = ({ delay = 0, className = "", as: Tag = "div", children }) => (
  <Tag className={`reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` }}>
    {children}
  </Tag>
);

const Arrow = () => (
  <svg
    className="inline-block size-[0.7em] translate-y-[-1px] opacity-45"
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
    className={`link-underline ${className}`}
  >
    {children}
  </a>
);

/* Sections share one rhythm: a mono label in a narrow left column, content in a
   wide right one, collapsing to a single column on small screens. */
const Section = ({ id, label, children }) => (
  <section
    id={id}
    className="border-t border-rule py-16 sm:py-24 grid gap-8 md:grid-cols-[10rem_1fr] md:gap-12"
  >
    <Reveal>
      <p className="eyebrow md:sticky md:top-24">{label}</p>
    </Reveal>
    <div>{children}</div>
  </section>
);

function Header() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    ["Work", "#work"],
    ["Experience", "#experience"],
    ["Writing", "#writing"],
    ["Contact", "#contact"],
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? "border-b border-rule bg-paper/85 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
        <a href="#top" className="font-mono text-xs tracking-[0.16em] uppercase">
          Shahzeb&nbsp;Umer
        </a>
        <nav className="flex items-center gap-5 sm:gap-7">
          {nav.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="link-underline hidden text-[0.8125rem] text-muted sm:inline"
            >
              {label}
            </a>
          ))}
          <Out href={links.github} className="text-[0.8125rem] text-muted">
            GitHub <Arrow />
          </Out>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="pt-32 pb-16 sm:pt-44 sm:pb-24">
      <Reveal>
        <p className="eyebrow">Software Engineer — {profile.location}</p>
      </Reveal>

      <Reveal delay={80}>
        <h1 className="mt-7 font-display text-[clamp(3.2rem,12vw,8.5rem)] leading-[0.9] tracking-[-0.02em]">
          {profile.name}
        </h1>
      </Reveal>

      <Reveal delay={160}>
        <p className="mt-6 font-display text-[clamp(1.6rem,3.6vw,2.6rem)] italic leading-tight text-accent">
          {profile.tagline}
        </p>
      </Reveal>

      <Reveal delay={240}>
        <div className="mt-10 max-w-2xl space-y-4 text-[1.0625rem] leading-relaxed text-muted">
          <p>{profile.intro}</p>
          <p>{profile.secondary}</p>
        </div>
      </Reveal>

      <Reveal delay={320}>
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.9375rem]">
          <Out href={links.resume}>
            Résumé <Arrow />
          </Out>
          <Out href={links.linkedin}>
            LinkedIn <Arrow />
          </Out>
          <Out href={links.medium}>
            Medium <Arrow />
          </Out>
          <a href={`mailto:${profile.email}`} className="link-underline">
            {profile.email}
          </a>
        </div>
      </Reveal>
    </section>
  );
}

function Work() {
  return (
    <Section id="work" label="Selected work">
      <ol className="space-y-14 sm:space-y-20">
        {work.map((p, i) => (
          <Reveal as="li" key={p.title} delay={i * 60}>
            <article className="group">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] leading-none tracking-[-0.01em]">
                  {p.title}
                </h3>
                <span className="eyebrow shrink-0">{p.year}</span>
              </div>

              <p className="mt-3 eyebrow text-accent">{p.domain}</p>

              <p className="mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-muted">
                {p.summary}
              </p>
              {p.detail && (
                <p className="mt-3 max-w-2xl leading-relaxed text-muted/85">{p.detail}</p>
              )}

              <ul className="mt-5 flex flex-wrap gap-x-2 gap-y-1.5">
                {p.stack.map((s) => (
                  <li
                    key={s}
                    className="rounded-full border border-rule px-2.5 py-1 font-mono text-[0.6875rem] text-faint"
                  >
                    {s}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[0.9375rem]">
                {p.links.map((l) => (
                  <Out key={l.href} href={l.href}>
                    {l.label} <Arrow />
                  </Out>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

function Experience() {
  return (
    <Section id="experience" label="Experience">
      <Reveal>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-tight">
            {experience.role}
          </h3>
          <span className="eyebrow">{experience.period}</span>
        </div>
        <p className="mt-2 text-[1.0625rem]">{experience.org}</p>
        <p className="mt-1 text-sm text-faint">{experience.note}</p>
      </Reveal>

      <ul className="mt-10 space-y-8">
        {experience.projects.map((p, i) => (
          <Reveal as="li" key={p.name} delay={i * 60} className="border-l border-rule pl-5">
            <h4 className="font-medium">
              {p.href ? (
                <Out href={p.href}>
                  {p.name} <Arrow />
                </Out>
              ) : (
                <>
                  {p.name} <span className="text-faint font-normal">(internal)</span>
                </>
              )}
            </h4>
            <p className="mt-2 max-w-2xl leading-relaxed text-muted">{p.text}</p>
          </Reveal>
        ))}
      </ul>

      <Reveal className="mt-12 border-t border-rule pt-8">
        <p className="eyebrow mb-4">Education</p>
        <ul className="space-y-3">
          {education.map((e) => (
            <li key={e.school} className="flex flex-wrap justify-between gap-x-6 gap-y-1">
              <span>
                <span className="font-medium">{e.detail}</span>
                <span className="text-muted"> — {e.school}</span>
              </span>
              <span className="eyebrow shrink-0">{e.period}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}

function Writing() {
  return (
    <Section id="writing" label="Writing">
      <Reveal>
        <p className="max-w-2xl text-[1.0625rem] leading-relaxed text-muted">
          On browser internals, automation, infrastructure and web architecture — at the{" "}
          <Out href="https://bumbletap.com/blog">BumbleTap engineering blog</Out> and on{" "}
          <Out href={links.medium}>Medium</Out>.
        </p>
      </Reveal>

      <ul className="mt-10 divide-y divide-rule border-y border-rule">
        {writing.map((a, i) => (
          <Reveal as="li" key={a.href} delay={i * 60}>
            <a
              href={a.href}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex flex-col gap-1.5 py-5 transition-colors hover:text-accent"
            >
              <span className="font-display text-[1.35rem] leading-snug">
                {a.title} <Arrow />
              </span>
              <span className="max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
                {a.blurb}
              </span>
            </a>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

function Stack() {
  return (
    <Section id="stack" label="Stack">
      <dl className="divide-y divide-rule border-y border-rule">
        {stack.map((row, i) => (
          <Reveal key={row.label} delay={i * 40}>
            <div className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
              <dt className="eyebrow sm:pt-1">{row.label}</dt>
              <dd className="text-muted">{row.items}</dd>
            </div>
          </Reveal>
        ))}
      </dl>
    </Section>
  );
}

function Footer() {
  return (
    <footer id="contact" className="border-t border-rule py-16 sm:py-24">
      <Reveal>
        <p className="eyebrow">Contact</p>
        <p className="mt-6 max-w-3xl font-display text-[clamp(2rem,6vw,4rem)] leading-[1.05] tracking-[-0.015em]">
          Always looking for the next{" "}
          <span className="italic text-accent">unfamiliar problem.</span>
        </p>
        <a
          href={`mailto:${profile.email}`}
          className="link-underline mt-7 inline-block text-lg"
        >
          {profile.email}
        </a>
      </Reveal>

      <Reveal
        delay={80}
        className="mt-14 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-rule pt-7"
      >
        <p className="font-mono text-[0.6875rem] text-faint">
          © {new Date().getFullYear()} Shahzeb Umer — {profile.location}
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] text-muted">
          <Out href={links.github}>GitHub</Out>
          <Out href={links.linkedin}>LinkedIn</Out>
          <Out href={links.medium}>Medium</Out>
          <Out href={links.resume}>Résumé</Out>
        </nav>
      </Reveal>
    </footer>
  );
}

export default function App() {
  useReveal();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-6 sm:px-8">
        <Hero />
        <Work />
        <Experience />
        <Writing />
        <Stack />
        <Footer />
      </main>
    </>
  );
}
