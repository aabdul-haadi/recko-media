export type MenuLink = {
  index: string;
  name: string;
  detail: string;
  target: string;
};

export const menuLinks: MenuLink[] = [
  { index: "01", name: "Home", detail: "Drive engagement and growth", target: "/" },
  {
    index: "02",
    name: "Our Services",
    detail: "Social, search and web",
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
    label: "Social Media",
    intro: "Connect with your audience and build meaningful relationships.",
    items: [
      {
        number: "01",
        title: "Facebook Ads",
        blurb:
          "Reach your ideal audience, increase brand awareness and drive conversions with targeted Facebook ad campaigns.",
      },
      {
        number: "02",
        title: "Instagram Ads",
        blurb:
          "From stunning visuals to compelling storytelling, campaigns that inspire, engage and convert your audience.",
      },
      {
        number: "03",
        title: "YouTube Ads",
        blurb:
          "Capture the attention of millions with compelling video ads that connect and convert potential customers.",
      },
    ],
  },
  {
    id: "growth",
    index: "02",
    label: "Search",
    intro: "Be found by the people who are already looking for you.",
    items: [
      { number: "01", title: "Search Engine Optimization", blurb: "Increase your website's visibility and ranking through strategic optimization. Drive organic traffic with tailored SEO solutions." },
      { number: "02", title: "Search Engine Marketing", blurb: "Achieve instant visibility through targeted pay-per-click campaigns. Maximize your ROI and reach your audience effectively." },
      { number: "03", title: "Google Ads", blurb: "Tailored Google Ads campaigns that drive targeted traffic, generate leads and grow sales." },
    ],
  },
  {
    id: "technology",
    index: "03",
    label: "Web",
    intro: "Create an impactful online presence that drives traffic and generates leads.",
    items: [
      { number: "01", title: "Website Design & Development", blurb: "Dynamic, user-friendly websites that represent your brand, drive traffic and generate leads." },
      { number: "02", title: "WordPress Website", blurb: "Custom WordPress development: responsive, dynamic websites tailored to your unique business needs." },
      { number: "03", title: "Shopify Website", blurb: "Take your online store to the next level with visually striking sites, seamless functionality and easy inventory management." },
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
    title: "Discovery",
    description:
      "We delve deep into your brand, industry and competitor landscape to understand your unique story.",
  },
  {
    number: "02",
    title: "Target audience",
    description:
      "We pinpoint your ideal customers, their interests and where they spend their time online.",
  },
  {
    number: "03",
    title: "Create & launch",
    description:
      "We craft compelling content and choose the right platforms where your audience thrives.",
  },
  {
    number: "04",
    title: "Optimize",
    description:
      "We manage campaigns with attention to detail, analyzing data to maximize impact and engage your community.",
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
