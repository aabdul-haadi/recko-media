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
<<<<<<< HEAD
    name: "Our Services",
    detail: "Creative, growth and technology",
=======
    name: "Services",
    detail: "Social, search and web",
>>>>>>> 570819fa94f67af3b6f72a72806689d4dea7b2b0
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
      { number: "01", title: "Facebook Ads", blurb: "Reach your ideal audience, increase brand awareness and drive conversions with targeted Facebook ad campaigns." },
      { number: "02", title: "Instagram Ads", blurb: "From stunning visuals to compelling storytelling, campaigns that inspire, engage and convert your audience." },
      { number: "03", title: "YouTube Ads", blurb: "Capture the attention of millions with compelling video ads that connect and convert potential customers." },
    ],
  },
  {
    id: "growth",
    index: "02",
    label: "Search",
    intro: "Be found by the people who are already looking for you.",
    items: [
<<<<<<< HEAD
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
=======
      { number: "01", title: "Search Engine Optimization", blurb: "Increase your website's visibility and ranking through strategic optimization. Drive organic traffic with tailored SEO solutions." },
      { number: "02", title: "Search Engine Marketing", blurb: "Achieve instant visibility through targeted pay-per-click campaigns. Maximize your ROI and reach your audience effectively." },
      { number: "03", title: "Google Ads", blurb: "Tailored Google Ads campaigns that drive targeted traffic, generate leads and grow sales." },
>>>>>>> 570819fa94f67af3b6f72a72806689d4dea7b2b0
    ],
  },
  {
    id: "technology",
    index: "03",
    label: "Web",
    intro: "Create an impactful online presence that drives traffic and generates leads.",
    items: [
<<<<<<< HEAD
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
=======
      { number: "01", title: "Website Design & Development", blurb: "Dynamic, user-friendly websites that represent your brand, drive traffic and generate leads." },
      { number: "02", title: "WordPress Website", blurb: "Custom WordPress development: responsive, dynamic websites tailored to your unique business needs." },
      { number: "03", title: "Shopify Website", blurb: "Take your online store to the next level with visually striking sites, seamless functionality and easy inventory management." },
>>>>>>> 570819fa94f67af3b6f72a72806689d4dea7b2b0
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
    description: "We delve deep into your brand, industry and competitor landscape to understand your unique story.",
  },
  {
    number: "02",
    title: "Target audience",
    description: "We pinpoint your ideal customers, their interests and where they spend their time online.",
  },
<<<<<<< HEAD
  {
    number: "02",
    title: "Design",
    description: "Shape the experience and the strategy behind it.",
  },
=======
>>>>>>> 570819fa94f67af3b6f72a72806689d4dea7b2b0
  {
    number: "03",
    title: "Create & launch",
    description: "We craft compelling content and choose the right platforms where your audience thrives.",
  },
  {
    number: "04",
    title: "Optimize",
    description: "We manage campaigns with attention to detail, analyzing data to maximize impact and engage your community.",
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
