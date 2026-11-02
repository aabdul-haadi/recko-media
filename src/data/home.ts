export type MenuLink = {
  index: string;
  name: string;
  detail: string;
  target: string;
};

export const menuLinks: MenuLink[] = [
  { index: "01", name: "Home", detail: "Growth systems that move revenue", target: "#top" },
  {
    index: "02",
    name: "Services",
    detail: "Creative, growth and technology teams",
    target: "#services",
  },
  { index: "03", name: "Work", detail: "Selected projects and previews", target: "#work" },
  { index: "04", name: "About", detail: "One team built around your business", target: "#about" },
  { index: "05", name: "Contact", detail: "Tell us where you want to go", target: "#contact" },
];

export type ServiceItem = {
  number: string;
  title: string;
  blurb: string;
};

export type ServiceTab = {
  id: string;
  index: string;
  label: string;
  intro: string;
  items: ServiceItem[];
};

export const serviceTabs: ServiceTab[] = [
  {
    id: "creative",
    index: "01",
    label: "Creative",
    intro: "How your business looks, sounds, and connects.",
    items: [
      {
        number: "01",
        title: "Branding & Identity",
        blurb:
          "Find your voice. Make your mark. We shape what makes you different into a brand people recognize.",
      },
      {
        number: "02",
        title: "Content & UGC",
        blurb: "Make something people stop for. Content and creator campaigns that earn attention.",
      },
      {
        number: "03",
        title: "UI/UX Design",
        blurb:
          "Make every interaction feel right. Sites, apps and experiences designed around the people using them.",
      },
    ],
  },
  {
    id: "growth",
    index: "02",
    label: "Growth",
    intro: "How your business gets found, chosen, and remembered.",
    items: [
      {
        number: "01",
        title: "Paid Media",
        blurb: "Spend where it compounds. Campaigns built around signal, not impressions.",
      },
      {
        number: "02",
        title: "SEO & Content",
        blurb:
          "Own the questions your buyers ask. Search and content that keep working after the click.",
      },
      {
        number: "03",
        title: "Email & Lifecycle",
        blurb:
          "Turn one visit into a relationship. Journeys that bring people back at the right moment.",
      },
    ],
  },
  {
    id: "technology",
    index: "03",
    label: "Technology",
    intro: "How your business runs faster with less friction.",
    items: [
      {
        number: "01",
        title: "Web Development",
        blurb: "Fast, buildable, measurable. Websites engineered to convert and easy to grow.",
      },
      {
        number: "02",
        title: "AI Automation",
        blurb:
          "Put the busywork on autopilot. Assistants and workflows that clear hours every week.",
      },
      {
        number: "03",
        title: "CRM & Integrations",
        blurb: "One source of truth. Tools connected so data moves without copy-paste.",
      },
    ],
  },
];

export type ProcessStep = {
  number: string;
  title: string;
  description: string;
};

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Understand",
    description: "Find the friction, the opportunity and the next useful move.",
  },
  { number: "02", title: "Design", description: "Shape the experience and the system behind it." },
  {
    number: "03",
    title: "Build",
    description: "Connect the website, workflows and tools into working form.",
  },
  {
    number: "04",
    title: "Refine",
    description: "Learn from real use and improve what happens next.",
  },
];

export const partnershipItems = [
  "Campaigns",
  "Website improvements",
  "Automation",
  "CRM management",
  "Reporting",
  "Ongoing experimentation",
];
