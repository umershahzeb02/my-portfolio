/* The blog: the index at /blog/, one page per post at /blog/<slug>/, and the
   404 Pages serves for anything else. All of it is rendered ahead of time from
   the Markdown in content/blog — see scripts/blog-plugin.mjs.

   Where the home page is a sidebar and a scrolling column, these are one
   centred column set for reading. The vocabulary is the home page's: the name
   in Computer Modern with its flower, the italic epigraph in the accent,
   numbered labels in mono, and cards that lift on hover. */
import { useEffect, useRef } from "react";
import { links, profile } from "./data";
import Socials from "./Socials";
import { CopyEmail, Out, Reveal, Shell, formatDate, href, useActiveSection } from "./ui";

const SITE_NAV = [
  ["Home", "", "home"],
  ["Blog", "blog/", "blog"],
  ["RSS", "blog/rss.xml", "rss"],
];

/* The name, small, with its flower — the sidebar's identity cut down to a
   wordmark. Right padding on narrow screens keeps the nav clear of the fixed
   theme toggle, which sits over this corner until the column has margins. */
function Masthead({ current }) {
  return (
    <header className="flex flex-wrap items-baseline justify-between gap-x-10 gap-y-5 pt-10 pr-12 pb-20 sm:pt-14 md:pr-0 lg:pb-24">
      <div className="relative w-fit">
        <a
          href={href()}
          className="t-wordmark relative z-10 text-slate-100 transition-colors duration-300 hover:text-teal-300"
        >
          {profile.name}
        </a>
        <div className="motif-name motif-small" aria-hidden="true" />
      </div>
      <nav aria-label="Site">
        <ul className="flex gap-6">
          {SITE_NAV.map(([label, path, key]) => (
            <li key={key}>
              <a
                href={href(path)}
                aria-current={current === key ? "page" : undefined}
                className={`mast-link t-label ${
                  current === key
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
    </header>
  );
}

/* Who wrote it and how to reach them. Below the wide breakpoint this closes
   the page as a colophon, after the asterism. No tagline: it belongs to the
   home page, and repeated under every post it would stop reading as a line and
   start reading as a signature. */
function Signoff() {
  return (
    <Reveal as="footer" className="pt-20 pb-24 xl:hidden">
      <p className="asterism" aria-hidden="true" />
      <div className="mt-14 flex items-center gap-3">
        <div className="motif-mark shrink-0" aria-hidden="true" />
        <p className="t-subheading text-slate-100">{profile.name}</p>
      </div>
      <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-5">
        <CopyEmail />
        <Socials />
      </div>
    </Reveal>
  );
}

/* The page's body, below its title. It is the positioning context for the
   margins: on wide screens the byline, and a post's contents, are pinned just
   outside it, level with its first line and running its full height so they
   can stay in view while it scrolls. */
function Body({ byline = "Author", className = "", children }) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-y-0 left-full ml-16 hidden w-56 xl:block">
        <Byline label={byline} />
      </div>
    </div>
  );
}

/* The same, on wide screens, as the right margin's counterpart to the
   contents on the left: a mono label on the same line, the name, and the
   icons. The masthead already carries the flower, so this does not. */
function Byline({ label }) {
  return (
    <aside aria-label="About the author" className="reveal sticky top-24" style={{ "--reveal-delay": "60ms" }}>
      <p className="t-label text-slate-500">{label}</p>
      <p className="t-subheading mt-4 text-slate-100">{profile.name}</p>
      <div className="mt-5">
        <Socials />
      </div>
    </aside>
  );
}

/* Every blog page: the masthead, the column, and the sign-off below it. */
function Frame({ current, children }) {
  return (
    <Shell skipTo="content" layout="column">
      <Masthead current={current} />
      <main id="content" className="xl:pb-32">
        {children}
      </main>
      <Signoff />
    </Shell>
  );
}

const Tags = ({ tags, className = "" }) =>
  tags.length > 0 && (
    <ul className={`stack flex flex-wrap gap-x-4 gap-y-1.5 ${className}`} aria-label="Tags">
      {tags.map((t) => (
        <li key={t} className="t-meta">
          {t}
        </li>
      ))}
    </ul>
  );

/* The name a post's title carries into a view transition. The same name on
   the list's title and the post's h1 is what lets the browser morph one into
   the other when a reader follows the link. */
const titleTransition = (post) => ({
  viewTransitionName: `post-${post.slug}`,
  viewTransitionClass: "post-title",
});

const Draft = ({ post }) =>
  post.draft && <span className="t-meta text-teal-300"> · draft</span>;

/* One post in the home page's Writing section, alongside the Medium cards. */
export function PostCard({ post, level: Heading = "h3" }) {
  return (
    <a href={href(`blog/${post.slug}/`)} className="card group/link -mx-4 block p-4">
      <p className="t-meta text-slate-500">
        {formatDate(post.date)} · {post.minutes} min read
        <Draft post={post} />
      </p>
      <Heading
        className="t-heading mt-1.5 text-slate-100 transition-colors duration-300 group-hover/link:text-teal-300"
        style={titleTransition(post)}
      >
        {post.title}
      </Heading>
      {post.summary && <p className="t-body mt-1.5 text-slate-400">{post.summary}</p>}
      <Tags tags={post.tags} className="mt-3" />
    </a>
  );
}

/* The index reads as a journal's contents page rather than a feed. The
   newest post is set as a lead, the way a magazine opens on its feature;
   the rest follow as an archive, each entry a single line from its number to
   its date, joined by a dotted leader.

   Posts are numbered in the order they were written, so a number stays with
   its post as newer ones arrive. */
const number = (n) => `Nº ${String(n).padStart(2, "0")}`;

/* A post's number as a painted ornament: an emblem built from n of its
   principal element, rendered by scripts/ornament-sketch.js in the
   hibiscus's hand and shown as a background image like the flower, so only
   the current theme's paint is fetched. Ten are painted; past that the
   number is set in type. */
const PAINTED = 10;
function Ornament({ n, className = "", style }) {
  if (n > PAINTED) return <span className={`t-index ${className}`}>{number(n)}</span>;
  return <span className={`ornament ${className}`} data-n={n} role="img" aria-label={number(n)} style={style} />;
}

/* Like the title, a post's ornament carries one view-transition name in the
   list and in the post's header, so following the link carries it across.
   The dateline's frieze repeats ornaments already on the page and stays
   unnamed: a name used twice on one page cancels the whole transition. */
const ornamentTransition = (post) => ({ viewTransitionName: `ornament-${post.slug}` });

function Lead({ post, n }) {
  return (
    <article className="lead">
      <Reveal as="p" className="flex items-center gap-4">
        <Ornament n={n} className="ornament-lead" style={ornamentTransition(post)} />
        <span className="t-label text-slate-400">Latest</span>
      </Reveal>
      <Reveal as="h2" delay={100} className="t-title mt-5 text-slate-100">
        <a
          href={href(`blog/${post.slug}/`)}
          className="transition-colors duration-300 hover:text-teal-300"
          style={titleTransition(post)}
        >
          {post.title}
        </a>
      </Reveal>
      {post.summary && (
        <Reveal as="p" delay={200} className="t-role mt-5 max-w-[32em] text-teal-300">
          {post.summary}
        </Reveal>
      )}
      <Reveal delay={300} className="mt-7 flex flex-wrap items-baseline gap-x-6 gap-y-3">
        <p className="t-meta text-slate-500">
          <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.minutes} min read
          <Draft post={post} />
        </p>
        <Tags tags={post.tags} />
        {/* The title is the link; this repeats it for the reader who looks
            for one at the end, so it stays out of the tab order. */}
        <a
          href={href(`blog/${post.slug}/`)}
          tabIndex={-1}
          aria-hidden="true"
          className="lead-read t-link ml-auto text-slate-200 transition-colors duration-300 hover:text-teal-300"
        >
          Read <span className="lead-read-arrow">→</span>
        </a>
      </Reveal>
    </article>
  );
}

/* One archive entry: number, title, leader, date — then a single line of
   summary under the title. The whole entry is the link. */
function Entry({ post, n }) {
  const [day, month] = formatDate(post.date).split(" ");
  return (
    <a href={href(`blog/${post.slug}/`)} className="entry">
      <Ornament n={n} className="entry-number" style={ornamentTransition(post)} />
      <span className="entry-line">
        <span className="entry-title" style={titleTransition(post)}>
          {post.title}
          <Draft post={post} />
        </span>
        <span className="entry-leader" aria-hidden="true" />
        <time className="t-meta entry-date" dateTime={post.date}>
          {day} {month}
        </time>
      </span>
      {post.summary && <span className="entry-summary">{post.summary}</span>}
    </a>
  );
}

/* The dateline: a band ruled above, and below by the lead's own rule, as a
   newspaper's folio runs under its masthead. The count and the RSS link
   hold its ends; between them every post's ornament, oldest first, each a
   way into its post — the archive's colour, brought up to the top. */
function Dateline({ posts, since }) {
  const painted = posts
    .map((p, i) => [p, posts.length - i])
    .filter(([, n]) => n <= PAINTED)
    .reverse();
  return (
    <Reveal delay={200} className="dateline mt-12">
      <p className="t-label text-slate-500">
        {posts.length} {posts.length === 1 ? "post" : "posts"} · since {since}
      </p>
      <ol className="frieze" aria-label="Posts">
        {painted.map(([p, n]) => (
          <li key={p.slug}>
            <a href={href(`blog/${p.slug}/`)} title={p.title} aria-label={p.title}>
              <span className="ornament" data-n={n} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
      <a
        href={href("blog/rss.xml")}
        className="t-label text-slate-500 transition-colors duration-300 hover:text-teal-300"
      >
        RSS
      </a>
    </Reveal>
  );
}

export function BlogIndex({ posts }) {
  const [lead, ...rest] = posts;
  const since = posts.at(-1)?.date.slice(0, 4);

  // The rest arrive newest first, so the years and each year's list do too.
  const years = [];
  rest.forEach((p, i) => {
    const year = p.date.slice(0, 4);
    if (years.at(-1)?.[0] !== year) years.push([year, []]);
    years.at(-1)[1].push([p, rest.length - i]);
  });

  return (
    <Frame current="blog">
      {/* Set as a journal's masthead, in the archive's own voice: the title,
          a line of description in the quiet italic the years use — leaving
          the lead the page's only teal epigraph — and then a dateline. */}
      <Reveal as="h1" className="t-display text-slate-100">
        Blog
      </Reveal>
      <Reveal as="p" delay={100} className="masthead-note mt-4">
        Notes on browser internals, automation, infrastructure and web architecture.
      </Reveal>
      {lead && <Dateline posts={posts} since={since} />}

      {!lead ? (
        <Body className="mt-16">
          <Reveal className="t-body text-slate-400" delay={60}>
            <p>
              Nothing published here yet. Earlier writing is on{" "}
              <Out href={links.medium} className="!inline">
                Medium
              </Out>
              .
            </p>
          </Reveal>
        </Body>
      ) : (
        <Body>
          <Lead post={lead} n={posts.length} />

          {years.length > 0 && (
            <section className="mt-20" aria-label="Archive">
              <Reveal as="h2" className="t-label text-slate-400">
                Archive
              </Reveal>
              {years.map(([year, list]) => (
                <div key={year} className="mt-10">
                  <Reveal as="h3" className="year-rule">
                    {year}
                  </Reveal>
                  <ol className="mt-3">
                    {list.map(([p, n], i) => (
                      <Reveal as="li" key={p.slug} delay={i * 100}>
                        <Entry post={p} n={n} />
                      </Reveal>
                    ))}
                  </ol>
                </div>
              ))}
            </section>
          )}
        </Body>
      )}
    </Frame>
  );
}

/* A hairline along the top edge that fills as the post is read. Written
   straight to the element through rAF, so scrolling never re-renders React. */
function Progress() {
  const bar = useRef(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.current?.style.setProperty("--progress", max > 0 ? Math.min(1, window.scrollY / max) : 0);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={bar} className="progress" aria-hidden="true" />;
}

/* The post's sections, numbered the way the home page numbers its own. Under
   two there is nothing to navigate, so it is left out.

   On narrower screens it sits between the header and the body. On wide ones
   it moves to the left margin and stays in view, marking the section being
   read the way the home page's nav does. */
function Contents({ headings }) {
  const active = useActiveSection(headings.map((h) => h.id));
  if (headings.length < 2) return null;
  return (
    <div className="xl:absolute xl:inset-y-0 xl:right-full xl:mr-16 xl:w-52">
      <details
        className="toc reveal mb-14 xl:sticky xl:top-24 xl:mx-0 xl:mb-0 xl:bg-transparent xl:p-0"
        style={{ "--reveal-delay": "60ms" }}
        open
      >
        <summary className="t-label text-slate-500">Contents</summary>
        <ol className="mt-4 space-y-2">
          {headings.map((h, i) => (
            <li key={h.id} className="flex items-baseline gap-3">
              <span className="t-index text-teal-300/70" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <a
                href={`#${h.id}`}
                aria-current={active === h.id ? "true" : undefined}
                className={`t-body transition-colors duration-300 hover:text-teal-300 ${
                  active === h.id ? "text-teal-300 xl:font-medium" : "text-slate-400"
                }`}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

const Sibling = ({ post, label, className = "" }) => (
  <a href={href(`blog/${post.slug}/`)} className={`card group/link -mx-4 block p-4 ${className}`}>
    <p className="t-label text-slate-500">{label}</p>
    <p className="t-heading mt-2 text-slate-100 transition-colors duration-300 group-hover/link:text-teal-300">
      {post.title}
    </p>
  </a>
);

/* The copy buttons are in the post's HTML from the build; this gives them
   something to do. One listener on the body serves every block. */
function useCopyButtons(ref) {
  useEffect(() => {
    const body = ref.current;
    if (!body) return;
    const timers = new Map();
    const onClick = async (e) => {
      const button = e.target.closest(".code-copy");
      if (!button) return;
      const code = button.parentElement.querySelector("pre code");
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = "Copied";
      } catch {
        button.textContent = "Selected";
        const range = document.createRange();
        range.selectNodeContents(code);
        getSelection().removeAllRanges();
        getSelection().addRange(range);
      }
      clearTimeout(timers.get(button));
      timers.set(button, setTimeout(() => (button.textContent = "Copy"), 2000));
    };
    body.addEventListener("click", onClick);
    return () => {
      body.removeEventListener("click", onClick);
      timers.forEach(clearTimeout);
    };
  }, [ref]);
}

export function Post({ post, n, newer, older }) {
  const body = useRef(null);
  useCopyButtons(body);
  return (
    <Frame current="blog">
      <Progress />
      <article>
        {/* Set centred, like a title page, so the post opens as its own
            piece rather than as one more row of the site. It closes on a short
            rule in the links' gold, which hands over to the body. Each line
            enters on its own beat, in reading order. */}
        <header className="post-head">
          {/* The post's ornament, from the index, set as a title page sets
              its emblem. */}
          <Reveal className="mb-7">
            <Ornament n={n} className="ornament-post" style={ornamentTransition(post)} />
          </Reveal>
          <Reveal as="p" delay={100} className="t-meta text-slate-500">
            {/* Each date holds together; the line may only break between
                its parts. */}
            <time className="whitespace-nowrap" dateTime={post.date}>{formatDate(post.date)}</time> ·{" "}
            <span className="whitespace-nowrap">{post.minutes} min read</span>
            {post.updated && (
              <>
                {" · "}
                <span className="whitespace-nowrap">
                  updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                </span>
              </>
            )}
            <Draft post={post} />
          </Reveal>
          <Reveal as="h1" delay={200} className="t-title mt-4 text-slate-100" style={titleTransition(post)}>
            {post.title}
          </Reveal>
          {/* A written summary heads the post as an epigraph, the way the
              tagline sits under the name. */}
          {!post.excerpt && (
            <Reveal as="p" delay={300} className="t-role mx-auto mt-5 max-w-[32em] text-teal-300">
              {post.summary}
            </Reveal>
          )}
          {post.tags.length > 0 && (
            <Reveal delay={400} className="mt-6">
              <Tags tags={post.tags} className="justify-center" />
            </Reveal>
          )}
          <Reveal delay={500} className="post-rule mt-10" aria-hidden="true" />
        </header>

        <Body byline="Written by" className="mt-14">
          <Contents headings={post.headings} />

          {/* The body is HTML rendered from the post's Markdown at build
              time. It comes from files in this repo, never from a visitor. */}
          <Reveal delay={100}>
            <div ref={body} className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
          </Reveal>
        </Body>
      </article>

      {(older || newer) && (
        <nav aria-label="More posts" className="mt-24 grid gap-y-3 sm:grid-cols-2 sm:gap-x-10">
          {older && <Sibling post={older} label="← Older" />}
          {newer && <Sibling post={newer} label="Newer →" className="sm:col-start-2 sm:text-right" />}
        </nav>
      )}
    </Frame>
  );
}

export function NotFound() {
  return (
    <Frame>
      <Reveal>
        <p className="t-index text-teal-300/70">404</p>
        <h1 className="t-display mt-3 text-slate-100">Not found</h1>
        <p className="t-role mt-5 text-teal-300">
          Nothing lives at this address. It may have moved, or never existed.
        </p>
      </Reveal>
      <Body className="mt-10">
        <Reveal delay={60}>
          <p className="t-body text-slate-400">
            Try the <a href={href()}>home page</a> or the <a href={href("blog/")}>blog</a>.
          </p>
        </Reveal>
      </Body>
    </Frame>
  );
}
