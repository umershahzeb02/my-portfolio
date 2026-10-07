import { profile, links, work, experience, writing, education } from "./data";
import {
  Arrow,
  Out,
  Reveal,
  CopyEmail,
  SectionLabel,
  Shell,
  href,
  useActiveSection,
} from "./ui";
import { PostCard } from "./Blog";
import Socials from "./Socials";

const NAV = [
  ["About", "about"],
  ["Experience", "experience"],
  ["Projects", "projects"],
  ["Writing", "writing"],
];
const NAV_IDS = NAV.map(([, id]) => id);

function Sidebar() {
  const active = useActiveSection(NAV_IDS);

  return (
    <header className="sidebar py-12 lg:py-16">
      {/* Only the identity sits up top. The name gets its own w-fit wrapper so
          the ornament can be pinned to the END of the text — left:100% of a
          shrink-wrapped box lands just past the final r. On a full-width block
          it would have landed at the column edge instead. */}
      <div>
        <div className="relative w-fit">
          <h1 className="t-display relative z-10 text-slate-100">{profile.name}</h1>
          {/* Ornament. A div, not a component: the flower is a
              pre-rendered image painted by the stylesheet, so there is
              nothing to render and nothing to execute. */}
          <div className="motif-name" aria-hidden="true" />
        </div>
        <p className="t-role mt-5 text-teal-300">{profile.tagline}</p>
      </div>

      {/* The nav is its own group between the identity and the contact block,
          and it takes all the leftover height of the column so it can centre
          itself inside it. That puts the items in the middle of the sidebar
          rather than hanging off the name or riding on top of the contact
          details. Handing the free space to this group is also what pins the
          other two: space-between is left with nothing to distribute, so the
          name stays at the top and the contact block at the foot. */}
      <div className="nav-mid hidden lg:flex">
        <nav aria-label="Sections">
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

      {/* Contact stays at the foot. The top margin only does anything in the
          stacked mobile layout, where the nav group is display:none and this
          would otherwise sit directly under the tagline. 23 rather than 14
          because the old markup nested this inside the nav group and picked up
          a second margin on the way down; this keeps the mobile gap at the 92px
          it already rendered at instead of quietly tightening it. */}
      <div className="mt-23 lg:mt-0">
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

      {/* A timeline: a hairline down the left, a node level with each role's
          dates — filled for the current role, hollow for the ones before it —
          and a tail that fades out below the last, into earlier history. */}
      <ol className="timeline space-y-4">
        {experience.map((job, i) => (
          <Reveal
            as="li"
            key={job.orgShort}
            className={`timeline-item ${job.period.includes("Present") ? "is-current" : ""}`}
            delay={i * 60}
          >
            <div className="card -mx-4 p-4">
              <p className="t-meta text-slate-500">
                {job.period}
                {job.location && ` · ${job.location}`}
              </p>
              {/* Role and employer share a line. items-baseline rather than items-center
                  because the two sit at different sizes, and baselines are what the eye
                  reads as level; centring would leave the smaller one floating. */}
              <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
                <h3 className="t-heading text-slate-100">{job.role}</h3>
                {/* Muted so it separates without competing, and aria-hidden so screen
                    readers do not announce "middle dot" between the two phrases. */}
                <span className="t-body text-slate-600" aria-hidden="true">·</span>
                <p className="t-body text-slate-300">
                  {job.orgHref ? (
                    <Out href={job.orgHref} className="!text-slate-300 hover:!text-teal-300">
                      {job.orgShort} <Arrow />
                    </Out>
                  ) : (
                    job.orgShort
                  )}
                </p>
            </div>
            <p className="t-body mt-1 text-sm text-slate-500">{job.note}</p>

            {/* Indented so the platforms sit beneath the role rather than beside it.
                Padding does the nesting on its own here, with no rule to lean on. */}
            <ul className="mt-6 space-y-5 pl-5 sm:pl-7">
              {job.projects.map((p) => (
                <li key={p.name}>
                  <h4 className="t-subheading flex items-center gap-2 text-slate-200">
                    {/* Same treatment as a project's logo: em-sized to the
                        name, decorative, since the name says what it is. */}
                    {p.logo && (
                      <img
                        src={p.logo}
                        alt=""
                        width="192"
                        height="192"
                        className="size-[1.35em] shrink-0"
                      />
                    )}
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
                  {p.text && <p className="t-body mt-1.5 text-slate-400">{p.text}</p>}

                  {/* Work nested under a platform, set off by a hairline rather
                      than a further indent, and kept to a line or two. */}
                  {p.parts?.map((part) => (
                    <div key={part.name} className="project-part mt-4">
                      <h5 className="t-subheading text-[0.9375rem] text-slate-200">{part.name}</h5>
                      <p className="t-body mt-1 text-slate-400">{part.text}</p>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
            </div>
          </Reveal>
        ))}
      </ol>

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
                <span className="t-label domain-chip text-teal-300/80">{p.domain}</span>
              </div>

              <h3 className="t-heading mt-2 flex items-center gap-2.5 text-[1.1875rem] text-slate-100 transition-colors duration-300 group-hover:text-teal-300">
                {/* The logo is sized in em, so it stays the height of the
                    title it sits beside. Decorative: the title names it. */}
                {p.logo && (
                  <img
                    src={p.logo}
                    alt=""
                    width="192"
                    height="192"
                    className="size-[1.35em] shrink-0"
                  />
                )}
                {p.title}
              </h3>

              <p className="t-body mt-2 text-slate-400">{p.summary}</p>
              {p.detail && <p className="t-body mt-2 text-slate-500">{p.detail}</p>}

              <ul className="stack mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
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

/* Posts from the blog lead, when there are any: they are the ones that live
   here. The Medium pieces follow, and the section hands off to the full list. */
function Writing({ posts }) {
  return (
    <section id="writing" className="scroll-mt-24 pb-24" aria-label="Writing">
      <SectionLabel index="04">Writing</SectionLabel>

      <Reveal className="t-body mb-6 text-slate-400">
        <p>
          On browser internals, automation, infrastructure and web architecture
          {posts.length > 0 && (
            <>
              , <a href={href("blog/")}>here</a>
            </>
          )}
          , at the{" "}
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
        {posts.map((p, i) => (
          <Reveal as="li" key={p.slug} delay={i * 60}>
            <PostCard post={p} level="h3" />
          </Reveal>
        ))}
        {writing.map((a, i) => (
          <Reveal as="li" key={a.href} delay={(posts.length + i) * 60}>
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

      {posts.length > 0 && (
        <Reveal className="mt-8 px-4 lg:px-0" delay={80}>
          <a
            href={href("blog/")}
            className="t-link text-slate-200 transition-colors duration-300 hover:text-teal-300"
          >
            All posts →
          </a>
        </Reveal>
      )}
    </section>
  );
}

export default function App({ posts = [] }) {
  return (
    <Shell skipTo="about">
      <Sidebar />
      <main className="pt-4 lg:py-20">
        <About />
        <Experience />
        <Projects />
        <Writing posts={posts} />
      </main>
    </Shell>
  );
}
