/* All copy lives here so the page can be updated without touching layout code. */

export const profile = {
  name: "Shahzeb Umer",
  tagline: "The stack follows the problem.",
  location: "Islamabad, Pakistan",
  email: "umershahzeb@gmail.com",
  intro:
    "I pick the stack to fit the problem rather than the other way round. So far that has meant browser internals, multimodal AI systems, production platforms at scale, and a fair amount of algorithmic work.",
  secondary:
    "The common thread is depth — going as far down as a problem actually requires instead of stopping at the framework.",
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
    domain: "Browser internals",
    year: "2025",
    summary:
      "A Chrome extension that binds arbitrary keystrokes to DOM actions on any website — single-key bindings for element invocation, text entry and sandboxed user JavaScript, plus multi-step Auto-Actions with conditional branching, waits and variable extraction.",
    detail:
      "The hard problem is durability. Conventional CSS selectors break the moment a site redeploys, so the element resolver identifies targets by multi-representation consensus and traverses shadow DOM. Privileged execution spans Chrome's isolated, main and user-script worlds through a cross-world messaging bridge, which buys CORS-exempt requests without giving up a strictly client-side design — no backend, no telemetry.",
    stack: ["Manifest V3", "JavaScript", "Next.js", "Cloudflare Workers & R2", "Vitest"],
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
    domain: "Multimodal AI",
    year: "2025",
    summary:
      "A platform that transcribes, summarises and answers questions about video, using LLM APIs across text, audio and vision.",
    detail:
      "A real-time streaming pipeline over WebSockets emits live progress events, with retry and structured logging wrapped around every external call. The retrieval-augmented question-answering path pulls from a vector store using embedding search and reranking, so answers stay grounded and cite the timestamps they came from.",
    stack: ["Next.js", "FastAPI", "WebSockets", "Gemini & OpenAI-compatible APIs", "ChromaDB"],
    links: [{ label: "GitHub", href: "https://github.com/umershahzeb02/lumen" }],
  },
  {
    title: "pdf-to-json",
    domain: "Developer tooling",
    year: "2024",
    summary:
      "Converts PDF documents into structured JSON for downstream manipulation in web applications.",
    detail: "",
    stack: ["JavaScript", "Vercel"],
    links: [
      { label: "Live", href: "https://pdf2json.vercel.app" },
      { label: "GitHub", href: "https://github.com/umershahzeb02/pdf-to-json" },
    ],
  },
];

export const experience = {
  role: "Full Stack Developer",
  org: "Directorate of ICT, Allama Iqbal Open University",
  period: "Dec 2024 — Present",
  note: "A distance-learning institution serving 400,000+ students nationwide.",
  projects: [
    {
      name: "Islamic Research Index",
      href: "https://iri.aiou.edu.pk",
      text: "A Next.js 14 research-indexing platform hosting thousands of academic papers. Query optimisation and caching for page-load performance, and automated content-management workflows that cut manual indexing effort.",
    },
    {
      name: "AIOU Bookstore",
      href: "https://bookstore.aiou.edu.pk",
      text: "An e-commerce platform with secure payment processing and a modular architecture spanning online sales, POS, warehouse and notifications, with inventory synchronised between the online store and physical outlets.",
    },
    {
      name: "HR Management System",
      href: null,
      text: "Node.js/Express and Next.js over PostgreSQL, covering attendance, payroll, evaluations and employee lifecycle, with role-based access control and document storage in cloud object storage.",
    },
  ],
};

/* Hard-coded rather than fetched. The previous build pulled these through a
   third-party RSS-to-JSON proxy at render time, so a rate limit or an outage on
   someone else's service left the section blank. */
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

export const stack = [
  { label: "Languages", items: "TypeScript · JavaScript · Python · C++ · C# · SQL" },
  { label: "Backend", items: "Node.js · Express · FastAPI · REST APIs · WebSockets" },
  { label: "Frontend", items: "React · Next.js · React Native · Tailwind CSS" },
  { label: "Data", items: "PostgreSQL · MySQL · MongoDB · MS SQL Server · ChromaDB" },
  { label: "AI", items: "OpenAI-compatible & Gemini APIs · RAG · embeddings · reranking" },
  { label: "Infrastructure", items: "Docker · Kubernetes · AWS · Cloudflare · Nginx · CI/CD" },
];

export const education = [
  {
    school: "National University of Computer and Emerging Sciences (NUCES–FAST)",
    detail: "BS Computer Science",
    period: "2021 — 2026",
  },
  { school: "KIPS College", detail: "Pre-Engineering", period: "2019 — 2021" },
];
