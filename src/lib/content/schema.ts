import { partnershipItems, processSteps, serviceTabs } from "@/data/home";

/** Field types the homepage editor can render. */
export type Field =
  | { name: string; label: string; type: "text" | "url"; max?: number; help?: string }
  | { name: string; label: string; type: "textarea"; max?: number; help?: string }
  | { name: string; label: string; type: "strings"; help?: string }
  | { name: string; label: string; type: "list"; itemLabel: string; fields: Field[]; max?: number };

export type SectionDef = {
  key: string;
  label: string;
  description: string;
  /** Sections the admin may hide from the live site. */
  toggleable: boolean;
  fields: Field[];
};

export type SectionData = Record<string, unknown>;

const reviewsDefault = [
  {
    quote:
      "Yes you guys have been on toes since day 1 and helped us work out things in the best manner. Hats off to you guys for answering and reviewing all our queries, no matter how many times we've asked you to evaluate them. The developers in your team are really up to the mark. So thank you so much.",
    name: "Scrubbers Med",
    role: "",
  },
];

export const sectionDefs: SectionDef[] = [
  {
    key: "seo",
    label: "Homepage SEO",
    description: "Title, description and social sharing details for the homepage.",
    toggleable: false,
    fields: [
      { name: "title", label: "SEO title", type: "text", max: 70, help: "Shown in search results. Keep under 60 characters." },
      { name: "description", label: "Meta description", type: "textarea", max: 320, help: "Aim for 140–160 characters." },
      { name: "og_title", label: "Social share title", type: "text", max: 100 },
      { name: "og_description", label: "Social share description", type: "textarea", max: 300 },
      { name: "og_image", label: "Social share image URL", type: "url" },
      { name: "canonical", label: "Canonical URL", type: "url", help: "Leave empty to use the page's own address." },
    ],
  },
  {
    key: "hero",
    label: "Hero",
    description: "The first thing visitors see.",
    toggleable: false,
    fields: [
      { name: "label", label: "Small label above heading", type: "text", max: 120 },
      { name: "headline_1", label: "Heading line 1", type: "text", max: 60 },
      { name: "headline_2", label: "Heading line 2", type: "text", max: 60 },
      { name: "headline_highlight", label: "Highlighted word", type: "text", max: 40 },
      { name: "subtitle", label: "Subheading", type: "textarea", max: 300 },
      { name: "cta_label", label: "Button text", type: "text", max: 40 },
      { name: "cta_url", label: "Button link", type: "url", help: "Use #contact for the contact section, or a full address." },
      { name: "scroll_label", label: "Scroll hint", type: "text", max: 30 },
    ],
  },
  {
    key: "services_intro",
    label: "Services section",
    description: "Headings for 'What we do'. The services themselves are managed under Services.",
    toggleable: true,
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text", max: 60 },
      { name: "heading", label: "Heading", type: "text", max: 100 },
      { name: "subheading", label: "Subheading", type: "textarea", max: 300 },
      { name: "creative_intro", label: "Creative intro", type: "text", max: 200 },
      { name: "growth_intro", label: "Growth intro", type: "text", max: 200 },
      { name: "technology_intro", label: "Technology intro", type: "text", max: 200 },
      { name: "cta_label", label: "Link text", type: "text", max: 50 },
    ],
  },
  {
    key: "process",
    label: "How we work",
    description: "The four-step process.",
    toggleable: true,
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text", max: 60 },
      { name: "heading", label: "Heading", type: "text", max: 100 },
      {
        name: "steps", label: "Steps", type: "list", itemLabel: "Step", max: 8,
        fields: [
          { name: "title", label: "Title", type: "text", max: 60 },
          { name: "description", label: "Description", type: "textarea", max: 250 },
        ],
      },
    ],
  },
  {
    key: "about",
    label: "About",
    description: "The 'One connected path' story section.",
    toggleable: true,
    fields: [
      { name: "label", label: "Label", type: "text", max: 60 },
      { name: "heading_1", label: "Heading line 1", type: "text", max: 80 },
      { name: "heading_2", label: "Heading line 2", type: "text", max: 80 },
      { name: "intro", label: "Intro", type: "textarea", max: 300 },
      { name: "description_1", label: "Paragraph 1", type: "textarea", max: 500 },
      { name: "description_2", label: "Paragraph 2", type: "textarea", max: 500 },
      { name: "link_label", label: "Link text", type: "text", max: 50 },
      {
        name: "pillars", label: "Pillars", type: "list", itemLabel: "Pillar", max: 6,
        fields: [
          { name: "title", label: "Title", type: "text", max: 40 },
          { name: "line", label: "One-line description", type: "text", max: 160 },
        ],
      },
    ],
  },
  {
    key: "partnership",
    label: "Growth partnerships",
    description: "The ongoing partnership block.",
    toggleable: true,
    fields: [
      { name: "label", label: "Label", type: "text", max: 60 },
      { name: "heading_1", label: "Heading line 1", type: "text", max: 60 },
      { name: "heading_2", label: "Heading line 2", type: "text", max: 60 },
      { name: "heading_3", label: "Heading line 3", type: "text", max: 60 },
      { name: "copy", label: "Description", type: "textarea", max: 500 },
      { name: "items", label: "Included activities", type: "strings" },
      { name: "cta_label", label: "Button text", type: "text", max: 60 },
      { name: "cta_url", label: "Button link", type: "url" },
    ],
  },
  {
    key: "work",
    label: "Our work",
    description: "Portfolio teaser.",
    toggleable: true,
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text", max: 60 },
      { name: "heading", label: "Heading", type: "text", max: 100 },
      { name: "description", label: "Description", type: "textarea", max: 400 },
      { name: "categories", label: "Categories", type: "strings" },
      { name: "cta_label", label: "Button text", type: "text", max: 50 },
      { name: "cta_url", label: "Button link", type: "url" },
    ],
  },
  {
    key: "reviews",
    label: "Client experiences",
    description: "Testimonials.",
    toggleable: true,
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text", max: 60 },
      { name: "heading", label: "Heading", type: "text", max: 100 },
      {
        name: "items", label: "Testimonials", type: "list", itemLabel: "Testimonial", max: 20,
        fields: [
          { name: "quote", label: "Quote", type: "textarea", max: 600 },
          { name: "name", label: "Name / company", type: "text", max: 80 },
          { name: "role", label: "Role", type: "text", max: 80 },
        ],
      },
    ],
  },
  {
    key: "faq",
    label: "FAQ",
    description: "Frequently asked questions. Also published to search engines as FAQ rich results.",
    toggleable: true,
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text", max: 60 },
      { name: "heading", label: "Heading", type: "text", max: 100 },
      { name: "intro", label: "Intro", type: "textarea", max: 300 },
      {
        name: "items", label: "Questions", type: "list", itemLabel: "Question", max: 30,
        fields: [
          { name: "question", label: "Question", type: "text", max: 200 },
          { name: "answer", label: "Answer", type: "textarea", max: 1000 },
        ],
      },
      { name: "cta_label", label: "Link text", type: "text", max: 50 },
      { name: "cta_url", label: "Link", type: "url" },
    ],
  },
  {
    key: "attention",
    label: "Ambition banner",
    description: "'Your ambition. Our attention.'",
    toggleable: true,
    fields: [
      { name: "heading_1", label: "Heading line 1", type: "text", max: 60 },
      { name: "heading_2", label: "Heading line 2", type: "text", max: 60 },
      { name: "text", label: "Paragraph", type: "textarea", max: 400 },
      { name: "cta_label", label: "Link text", type: "text", max: 50 },
      { name: "cta_url", label: "Link", type: "url" },
    ],
  },
  {
    key: "contact",
    label: "Contact call-to-action",
    description: "'Let's build what's next.'",
    toggleable: false,
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text", max: 60 },
      { name: "heading", label: "Heading", type: "text", max: 100 },
      { name: "cta_label", label: "Button text", type: "text", max: 50 },
      { name: "cta_url", label: "Button link", type: "url", help: "Example: mailto:team@reckomedia.com or /contact" },
      { name: "text", label: "Paragraph", type: "textarea", max: 300 },
    ],
  },
  {
    key: "footer",
    label: "Footer & contact details",
    description: "Footer text, contact details and social links used on every page.",
    toggleable: false,
    fields: [
      { name: "tagline", label: "Description", type: "textarea", max: 300 },
      { name: "cta_heading", label: "Top banner text", type: "text", max: 80 },
      { name: "cta_highlight", label: "Top banner highlight", type: "text", max: 40 },
      { name: "services", label: "Services list", type: "strings" },
      { name: "email", label: "Email", type: "text", max: 200 },
      { name: "phone", label: "Phone", type: "text", max: 50 },
      { name: "address", label: "Address", type: "text", max: 200 },
      {
        name: "socials", label: "Social links", type: "list", itemLabel: "Link", max: 10,
        fields: [
          { name: "label", label: "Name", type: "text", max: 40 },
          { name: "href", label: "URL", type: "url" },
        ],
      },
      { name: "copyright", label: "Copyright name", type: "text", max: 80 },
    ],
  },
];

export const contentDefaults: Record<string, SectionData> = {
  seo: {
    title: "ReckoMEDIA — Social Media Marketing, SEO & Web Design Agency",
    description:
      "Social media advertising, SEO, PPC and web design from one agency in Karachi. Personalized strategies, affordable pricing and reliable execution.",
    og_title: "ReckoMEDIA — Social Media Marketing, SEO & Web Design Agency",
    og_description:
      "Drive engagement and growth with social media advertising, SEO, PPC and web design.",
    og_image: "",
    canonical: "",
  },
  hero: {
    label: "ReckoMEDIA — Social media marketing agency",
    headline_1: "Achieve your",
    headline_2: "digital goals",
    headline_highlight: "online.",
    subtitle:
      "Your brand deserves to shine, not get swallowed by the social media noise or buried in search results. We craft campaigns that turn clicks into customers and likes into loyal fans.",
    cta_label: "Get started",
    cta_url: "#contact",
    scroll_label: "Scroll",
  },
  services_intro: {
    eyebrow: "Our services",
    heading: "Services offered by our agency.",
    subheading: "Social media advertising, search marketing and web design, working together to grow your business.",
    creative_intro: serviceTabs[0]!.intro,
    growth_intro: serviceTabs[1]!.intro,
    technology_intro: serviceTabs[2]!.intro,
    cta_label: "Explore all services",
  },
  process: {
    eyebrow: "Our process",
    heading: "How we craft your campaign.",
    steps: processSteps.map(({ title, description }) => ({ title, description })),
  },
  about: {
    label: "ABOUT RECKOMEDIA",
    heading_1: "Your trusted partner",
    heading_2: "in digital marketing.",
    intro: "Your brand deserves a megaphone, not a whisper.",
    description_1:
      "You pour your heart into your products and services, but attracting the right audience online can feel like trekking through uncharted territory. We are your experienced guide and strategic partner, helping you conquer the peaks of online success.",
    description_2:
      "Our mission: empower digital success through proven methods and continuous learning, with a focus on excellence and results that last.",
    link_label: "Meet ReckoMEDIA",
    pillars: [
      { title: "Social Media", line: "Facebook, Instagram and YouTube ads that grow awareness and engagement." },
      { title: "Search", line: "SEO and search marketing that put you in front of people who are looking." },
      { title: "Web", line: "WordPress and Shopify websites that look sharp and convert visitors." },
    ],
  },
  partnership: {
    label: "GROWTH PARTNERSHIPS",
    heading_1: "One team.",
    heading_2: "Built around",
    heading_3: "your business.",
    copy:
      "An ongoing partnership bringing strategy, creative, marketing and technology together, from setting priorities to building, launching and improving.",
    items: [...partnershipItems],
    cta_label: "Let’s talk about your business",
    cta_url: "#contact",
  },
  work: {
    eyebrow: "Our portfolio",
    heading: "Check out our past projects.",
    description:
      "See the work we've done. We're proud of our diverse and successful accomplishments, showing our commitment to doing great work.",
    categories: ["Web & E-commerce", "Social Media", "Media Buying Case Studies"],
    cta_label: "View all portfolio",
    cta_url: "/portfolio",
  },
  reviews: { eyebrow: "Testimonials", heading: "What clients say about us.", items: reviewsDefault },
  faq: {
    eyebrow: "FAQ",
    heading: "Frequently asked questions.",
    intro: "Everything you might want to know before we talk. Can't find it? Ask us directly.",
    items: [
      {
        question: "What is digital marketing?",
        answer:
          "Digital marketing is the use of digital channels, platforms and technologies to promote products, services or brands. It includes social media marketing, search engine optimization, website building, email marketing and paid advertising, with the goal of reaching your audience, building awareness, driving website traffic and achieving measurable results.",
      },
      {
        question: "What does a digital marketing agency do?",
        answer:
          "A digital marketing agency creates and runs online marketing strategies: managing your social media presence, optimizing your website for search engines, running online advertising campaigns and analyzing data to refine the plan. It acts as a strategic partner that helps you grow in the digital marketplace.",
      },
      {
        question: "Why should I choose a full-service agency?",
        answer:
          "A full-service agency brings social media, SEO, web design and online advertising together. You get streamlined communication, cohesive strategy and consistent messaging, so you can focus on your business while we handle the intricacies of your online presence.",
      },
      {
        question: "What results can I expect from a social media marketing agency?",
        answer:
          "Typical outcomes include increased brand visibility, higher engagement with your target audience, more website traffic and better conversion rates. Results are tailored to your goals, and we work with you to reach and exceed them.",
      },
      {
        question: "How cost-effective is digital marketing compared with traditional marketing?",
        answer:
          "Digital marketing is typically less expensive than traditional marketing. You control your budget, target precisely, track performance in real time and adjust to optimize spending, with affordable options like social media advertising and email campaigns.",
      },
    ],
    cta_label: "Get started",
    cta_url: "#contact",
  },
  attention: {
    heading_1: "Your ambition.",
    heading_2: "Our attention.",
    text:
      "We're not just working for you; we're working with you. We share your passion for your business and are invested in your success every step of the way.",
    cta_label: "Meet ReckoMEDIA",
    cta_url: "/about",
  },
  contact: {
    eyebrow: "Make appointment",
    heading: "Ready to take the next step?",
    cta_label: "Get started",
    cta_url: "mailto:team@reckomedia.com",
    text: "Let's chat about how we can craft a winning digital marketing strategy that ignites your online presence. Contact us today and watch your brand take flight!",
  },
  footer: {
    tagline: "Social media advertising, SEO, PPC and web design to drive engagement and growth for your business.",
    cta_heading: "Ready to grow?",
    cta_highlight: "Let’s talk.",
    services: [
      "Social Media Advertising",
      "Search Engine Optimization",
      "Search Engine Marketing",
      "Website Design & Development",
    ],
    email: "team@reckomedia.com",
    phone: "0327 2514632",
    address: "Gulshan-e-Iqbal, Karachi, Pakistan",
    socials: [
      { label: "Facebook", href: "https://www.facebook.com/socialadservices" },
      { label: "Instagram", href: "https://www.instagram.com/socialadservices/" },
      { label: "WhatsApp", href: "https://wa.me/03272514632" },
    ],
    copyright: "ReckoMEDIA",
  },
};

export type ServiceCategory = "creative" | "growth" | "technology";
export const SERVICE_CATEGORIES: ServiceCategory[] = ["creative", "growth", "technology"];

export type PublicService = {
  id: string;
  slug: string;
  category: ServiceCategory;
  title: string;
  summary: string;
  details: string | null;
  features: string[];
  price: string | null;
  image_url: string | null;
  image_alt: string | null;
  cta_label: string | null;
  cta_url: string | null;
  featured: boolean;
  sort_order: number;
  status?: "draft" | "published";
};

export const SERVICE_COLUMNS =
  "id,slug,category,title,summary,details,features,price,image_url,image_alt,cta_label,cta_url,featured,sort_order,status";

/** Fallback used if the database is unreachable, so the public site never shows an empty services list. */
export const defaultServices: PublicService[] = serviceTabs.flatMap((tab) =>
  tab.items.map((item, i) => ({
    id: `${tab.id}-${i}`,
    slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    category: tab.id as ServiceCategory,
    title: item.title,
    summary: item.blurb,
    details: null,
    features: [],
    price: null,
    image_url: null,
    image_alt: null,
    cta_label: null,
    cta_url: null,
    featured: false,
    sort_order: i + 1,
  })),
);
