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
      "The team has been on their toes since day one and helped us work through everything in the best possible way. Their knowledge of web development and commitment to answering every query made the experience genuinely valuable.",
    name: "Scrubbers Med",
    role: "",
  },
  { quote: "The new site finally makes it easy for the right customers to understand what we do.", name: "Marketing Director", role: "B2B technology" },
  { quote: "We have a clearer brand, a better customer journey and a team that keeps improving it.", name: "Founder", role: "Consumer brand" },
  { quote: "The automation gave our team hours back each week, and it fits the way we already work.", name: "Operations Lead", role: "Professional services" },
  { quote: "Everything feels connected now: our campaigns, our website and the way we follow up.", name: "Managing Partner", role: "Growth stage business" },
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
    title: "ReckoMEDIA — Web Design, AI Automation & Digital Marketing",
    description:
      "Growth systems that move revenue. Web design, AI automation and digital marketing built together for your business.",
    og_title: "ReckoMEDIA — Web Design, AI Automation & Digital Marketing",
    og_description:
      "Growth systems that move revenue. Web design, AI automation and digital marketing built together.",
    og_image: "",
    canonical: "",
  },
  hero: {
    label: "ReckoMEDIA — Web design, AI automation & digital marketing",
    headline_1: "Growth systems",
    headline_2: "that move",
    headline_highlight: "revenue.",
    subtitle: "Web design, AI automation and digital marketing, working together to help your business grow.",
    cta_label: "Build your brief",
    cta_url: "#contact",
    scroll_label: "Scroll",
  },
  services_intro: {
    eyebrow: "What we do",
    heading: "Creative. Growth. Technology.",
    subheading: "Three disciplines. One connected approach to building your business online.",
    creative_intro: serviceTabs[0]!.intro,
    growth_intro: serviceTabs[1]!.intro,
    technology_intro: serviceTabs[2]!.intro,
    cta_label: "Explore all services",
  },
  process: {
    eyebrow: "How we work",
    heading: "A shared way of working.",
    steps: processSteps.map(({ title, description }) => ({ title, description })),
  },
  about: {
    label: "ABOUT RECKOMEDIA",
    heading_1: "One connected path.",
    heading_2: "From idea to impact.",
    intro: "ReckoMEDIA connects creative, marketing and technology around your business.",
    description_1:
      "From building a recognizable brand to producing engaging content, launching campaigns and developing digital platforms, we bring the pieces together to create meaningful growth.",
    description_2:
      "We believe good marketing should be more than visibility. It should create stronger customer relationships, better experiences and real opportunities.",
    link_label: "Meet ReckoMEDIA",
    pillars: [
      { title: "Creative", line: "Brands, content and social presence people remember." },
      { title: "Marketing", line: "Campaigns and search that turn attention into customers." },
      { title: "Technology", line: "Websites, stores and automation that keep it all running." },
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
    eyebrow: "Our work",
    heading: "See what we’ve been building.",
    description:
      "From memorable brand campaigns to digital experiences and performance driven marketing, explore the work we’ve created for businesses across different industries.",
    categories: ["Web & E-commerce", "Social Media Campaigns", "Media Buying Case Studies", "Content Production"],
    cta_label: "Explore our portfolio",
    cta_url: "/portfolio",
  },
  reviews: { eyebrow: "Client experiences", heading: "Good work travels.", items: reviewsDefault },
  attention: {
    heading_1: "Your ambition.",
    heading_2: "Our attention.",
    text:
      "Good partnerships need more than a handoff. They need clear roles, honest conversations and people who care about the result.",
    cta_label: "Meet ReckoMEDIA",
    cta_url: "/about",
  },
  contact: {
    eyebrow: "Start the conversation",
    heading: "Let's build what's next.",
    cta_label: "Build your brief",
    cta_url: "mailto:team@reckomedia.com",
    text: "Tell us where you want to go. We'll work out what comes next.",
  },
  footer: {
    tagline: "Web design, AI automation and digital marketing, built together to grow your business.",
    cta_heading: "Ready to grow?",
    cta_highlight: "Let’s talk.",
    services: [
      "Branding & Identity",
      "Content Production",
      "Social Media Marketing",
      "Paid Advertising",
      "SEO",
      "Website Design & Development",
      "AI Automation",
    ],
    email: "team@reckomedia.com",
    phone: "0327 2514632",
    address: "Karachi, Pakistan",
    socials: [
      { label: "Instagram", href: "#" },
      { label: "Facebook", href: "#" },
      { label: "LinkedIn", href: "#" },
      { label: "WhatsApp", href: "#" },
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
