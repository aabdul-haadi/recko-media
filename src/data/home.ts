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
    name: "Our Services",
    detail: "Creative, growth and technology",
    target: "/services",
  },
  {
    index: "03",
    name: "Portfolio",
    detail: "Selected projects and capabilities",
    target: "/portfolio",
  },
  {
    index: "04",
    name: "About Us",
    detail: "One team built around your business",
    target: "/about",
  },
  { index: "05", name: "Contact Us", detail: "Tell us where you want to go", target: "/contact" },
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
        blurb:
          "Harness the power of social media platforms to connect with your audience and build meaningful relationships. Drive brand awareness, engagement, and conversions with our dynamic social media marketing strategies.",
      },
      {
        number: "02",
        title: "Search Engine Optimization",
        blurb:
          "Increase your website's visibility and ranking on search engines through strategic optimization techniques. Drive organic traffic and improve your online presence with our tailored SEO solutions.",
      },
      {
        number: "03",
        title: "Search Engine Marketing",
        blurb:
          "Achieve instant visibility and exposure for your business through targeted pay-per-click advertising campaigns. Maximize your ROI and reach your target audience effectively with our SEM services.",
      },
      {
        number: "04",
        title: "Facebook Ads",
        blurb:
          "Harness the power of social media with our targeted Facebook Ads. Reach your ideal audience, increase brand awareness, and drive conversions with engaging and effective ad campaigns.",
      },
      {
        number: "05",
        title: "Instagram Ads",
        blurb:
          "Capture the attention of millions of active users with Instagram Ads. From stunning visuals to compelling storytelling, we create campaigns that inspire, engage, and convert your target audience.",
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
        blurb:
          "Create an impactful online presence with our top-notch website design and development services. We craft dynamic and user-friendly websites that effectively represent your brand, drive traffic, and generate leads.",
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
  {
    number: "02",
    title: "Design",
    description: "Shape the experience and the strategy behind it.",
  },
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
