export type MenuLink = {
  index: string;
  name: string;
  detail: string;
  target: string;
};

export const menuLinks: MenuLink[] = [
  { index: "01", name: "Home", detail: "Growth systems that move revenue", target: "/" },
  {
    index: "02",
    name: "Services",
    detail: "Creative, growth and technology",
    target: "/services",
  },
  { index: "03", name: "Portfolio", detail: "Selected projects and capabilities", target: "/portfolio" },
  { index: "04", name: "About", detail: "One team built around your business", target: "/about" },
  { index: "05", name: "Contact", detail: "Tell us where you want to go", target: "/contact" },
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
    intro: "How your business looks, sounds and connects.",
    items: [
      {
        number: "01",
        title: "Branding & Identity",
        blurb: "Build a brand people recognize, remember and trust.",
      },
      {
        number: "02",
        title: "Content Production",
        blurb:
          "Professional photography, reels, videos and creative campaigns that capture attention.",
      },
      {
        number: "03",
        title: "Social Media Management",
        blurb:
          "Consistent content, meaningful communication and a social presence that feels alive.",
      },
    ],
  },
  {
    id: "growth",
    index: "02",
    label: "Growth",
    intro: "Turn attention into measurable business opportunities.",
    items: [
      {
        number: "01",
        title: "Social Media Advertising",
        blurb: "Reach the right audience through strategic paid campaigns.",
      },
      {
        number: "02",
        title: "Search Engine Optimization",
        blurb: "Improve visibility and help customers discover your business.",
      },
      {
        number: "03",
        title: "Search Engine Marketing",
        blurb: "Connect your business with people actively searching for your services.",
      },
    ],
  },
  {
    id: "technology",
    index: "03",
    label: "Technology",
    intro: "Build the digital foundation behind your business.",
    items: [
      {
        number: "01",
        title: "Website Design & Development",
        blurb: "Modern websites designed to communicate clearly and convert visitors.",
      },
      {
        number: "02",
        title: "E-commerce Solutions",
        blurb: "Online stores built around your products and customers.",
      },
      {
        number: "03",
        title: "AI Automation",
        blurb: "Smarter workflows that reduce repetitive work and improve efficiency.",
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
  { number: "02", title: "Design", description: "Shape the experience and the strategy behind it." },
  {
    number: "03",
    title: "Build",
    description: "Connect websites, workflows and tools into working systems.",
  },
  {
    number: "04",
    title: "Refine",
    description: "Learn from real use and improve what happens next.",
  },
];

export const partnershipItems = [
  "Content production",
  "Social media management",
  "Campaigns",
  "Website improvements",
  "Automation",
  "CRM management",
  "Reporting",
  "Ongoing experimentation",
];
