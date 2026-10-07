/* All copy lives here so the page can be updated without touching layout code. */

/* Project logos. Imported rather than linked, so Vite fingerprints them and
   adds the base path; a project shows one beside its title when it has it. */
import bumbletapLogo from "./assets/projects/bumbletap.png";
import hrmsLogo from "./assets/projects/hrms.png";
import summitEhrLogo from "./assets/projects/summit-ehr.png";
import lumenLogo from "./assets/projects/lumen.svg";

export const profile = {
  name: "Shahzeb Umer",
  // Deliberately not "Full Stack Developer" here. That is the job title and it
  // belongs in Experience; as an identity line it binds the whole page to web.
  // Shown as a quotation, with its author; the quote marks are added where
  // it is set, so this stays plain text for meta tags.
  tagline: "Simplicity is prerequisite for reliability.",
  taglineBy: "Dijkstra",
  email: "umershahzeb@gmail.com",
  about: [
    "I’m a software engineer at Z360, where I work remotely on Summit EHR, an AI-native health record platform. Before that I shipped platforms and solutions at the Directorate of ICT at Allama Iqbal Open University.",
    "I pick the stack to fit the problem rather than the other way round. So far that has meant browser internals, multimodal AI systems, production platforms at scale, infrastructure, and a fair amount of algorithmic work. The common thread is depth: going as far down as a problem actually requires instead of stopping at the framework.",
    "I write about browser internals, automation and web architecture, and I’m always looking for the next unfamiliar problem.",
  ],
};

export const links = {
  github: "https://github.com/umershahzeb02",
  linkedin: "https://linkedin.com/in/umershahzeb",
  medium: "https://medium.com/@umershahzeb",
  resume:
    "https://github.com/umershahzeb02/umershahzeb02/blob/main/Shahzeb-Umer-Resume.pdf",
};

export const work = [
  {
    title: "BumbleTap",
    logo: bumbletapLogo,
    domain: "Browser internals",
    year: "2025",
    summary:
      "A Chrome extension that binds arbitrary keystrokes to DOM actions on any website. Single-key bindings cover element invocation, text entry and sandboxed user JavaScript, while multi-step Auto-Actions add conditional branching, waits and variable extraction.",
    detail:
      "The hard problem is durability. Conventional CSS selectors break the moment a site redeploys, so the element resolver identifies targets by multi-representation consensus and traverses shadow DOM. Privileged execution spans Chrome’s isolated, main and user-script worlds through a cross-world messaging bridge, which buys CORS-exempt requests without giving up a strictly client-side design. No backend, no telemetry.",
    links: [
      { label: "bumbletap.com", href: "https://bumbletap.com" },
      {
        label: "Chrome Web Store",
        href: "https://chromewebstore.google.com/detail/bumbletap/djgihkldjjfolnbkccfophpgflekmhhd",
      },
      { label: "Engineering blog", href: "https://bumbletap.com/blog" },
    ],
  },
  {
    title: "Lumen",
    logo: lumenLogo,
    domain: "Multimodal AI",
    year: "2025",
    summary:
      "A platform that transcribes, summarises and answers questions about video, using LLM APIs across text, audio and vision.",
    detail:
      "A real-time streaming pipeline over WebSockets emits live progress events, with retry and structured logging wrapped around every external call. The retrieval-augmented question-answering path pulls from a vector store using embedding search and reranking, so answers stay grounded and cite the timestamps they came from.",
    links: [{ label: "GitHub", href: "https://github.com/umershahzeb02/lumen" }],
  },
  {
    title: "pdf-to-json",
    domain: "Developer tooling",
    year: "2024",
    summary:
      "Converts PDF documents into structured JSON for downstream manipulation in web applications.",
    detail: "",
    links: [
      { label: "Live", href: "https://pdf2json.vercel.app" },
      { label: "GitHub", href: "https://github.com/umershahzeb02/pdf-to-json" },
    ],
  },
];

/* Newest first. `orgHref` links the employer; a project's `text` is optional,
   and `parts` lists work nested under it. Every description stays to a line
   or two, with no stacks — the detail belongs in a write-up. */
export const experience = [
  {
    role: "Software Engineer",
    orgShort: "Z360",
    orgHref: "https://z360.biz",
    period: "Aug 2026 – Present",
    location: "Remote",
    note: "Working on Summit EHR, Z360’s AI-native health record platform.",
    projects: [
      {
        name: "Summit EHR",
        logo: summitEhrLogo,
        href: "https://summit-ehr.com",
        text: "An AI-native EHR for outpatient clinics, with intake, documentation and follow-up built in.",
      },
    ],
  },
  {
    role: "Full Stack Developer",
    orgShort: "Directorate of ICT, AIOU",
    period: "Dec 2024 – 2026",
    note: "A distance-learning institution serving 400,000+ students nationwide.",
    projects: [
      {
        name: "HR Management System",
        logo: hrmsLogo,
        href: "https://hrms.aiou.edu.pk",
        text: "Attendance, payroll, evaluations and the staff lifecycle, with role-based access.",
        parts: [
          {
            name: "Bridge",
            text: "Our own attendance middleware, free of the vendor’s licence and lock-in.",
          },
        ],
      },
      {
        name: "Islamic Research Index",
        href: "https://iri.aiou.edu.pk",
        text: "A research-indexing platform hosting thousands of academic papers.",
      },
      {
        name: "AIOU Bookstore",
        href: "https://bookstore.aiou.edu.pk",
        text: "An e-commerce platform for online sales, POS and warehouse, synced across outlets.",
      },
    ],
  },
];

/* Hard-coded rather than fetched. The previous build pulled these through a
   third-party RSS-to-JSON proxy at render time, so a rate limit or an outage on
   someone else’s service left the section blank. */
export const writing = [
  {
    title: "Understanding Terraform",
    blurb:
      "Defining, provisioning and managing cloud resources as code, and what it takes to keep infrastructure consistent across environments.",
    href: "https://medium.com/@umershahzeb/understanding-terraform-a-comprehensive-guide-to-infrastructure-automation-65f741c0762c",
  },
  {
    title: "Mastering Prometheus",
    blurb:
      "The architecture and configuration of monitoring for distributed systems, from scrape design through alerting and scaling.",
    href: "https://medium.com/@umershahzeb/mastering-prometheus-a-comprehensive-guide-to-architecture-and-configuration-3522a852ea41",
  },
  {
    title: "Are We Making DevOps Complicated?",
    blurb:
      "A case for minimalism in tooling, and why flexible toolchains so often become sprawl.",
    href: "https://medium.com/@umershahzeb/are-we-making-devops-complicated-the-case-of-simplicity-in-tooling-54b5878b5d8a",
  },
];


export const education = [
  {
    school: "National University of Computer and Emerging Sciences (NUCES–FAST)",
    detail: "BS Computer Science",
    period: "2021 – 2026",
  },
  { school: "KIPS College", detail: "Pre-Engineering", period: "2019 – 2021" },
];
