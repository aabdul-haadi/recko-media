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
  features?: string[];
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
    label: "Paid Social & Creative",
    intro: "We stop the scroll, turn attention into enquiries and give every campaign a clear role.",
    items: [
      {
        number: "01",
        title: "Meta Ads (Facebook & Instagram)",
        blurb: "Full-funnel campaigns covering awareness, retargeting and conversion, with continuous testing of audiences, creatives and offers.",
        features: ["Campaign and account strategy", "Audience research and retargeting", "Creative testing", "Pixel, CAPI and event setup", "Weekly optimization and scaling"],
      },
      {
        number: "02",
        title: "Lead Generation Campaigns",
        blurb: "Real enquiries, not just form fills, with qualifying questions, quick follow-up flows and clear lead and customer cost tracking.",
        features: ["Instant forms, WhatsApp and Messenger", "Landing page lead funnels", "Lead quality filtering", "CRM and Sheets integration"],
      },
      {
        number: "03",
        title: "Social Media Management",
        blurb: "Consistent, active brand content planned, designed and published to build trust and support your paid campaigns.",
        features: ["Monthly content calendars", "Post and reel design", "Captions and community management", "Page and brand optimization"],
      },
      {
        number: "04",
        title: "Creative & Content Production",
        blurb: "Scroll-stopping ads, short-form video and UGC-style creative built to convert, backed by a structured testing framework.",
        features: ["Ad creatives and motion graphics", "Short-form video and UGC ads", "Copywriting and hooks", "Creative testing frameworks"],
      },
    ],
  },
  {
    id: "growth",
    index: "02",
    label: "Search & Growth",
    intro: "We connect intent, profitability and data so growth is measurable and repeatable.",
    items: [
      { number: "01", title: "Google Ads", blurb: "Search, Shopping and YouTube campaigns built around intent, supported by conversion tracking and bid management.", features: ["Keyword research", "Google Shopping and Performance Max", "YouTube video ads", "Conversion tracking and bid management"] },
      { number: "02", title: "E-commerce Growth", blurb: "Profitable sales for online stores, with campaigns scaled against real margins, delivery, returns and COD failures.", features: ["Shopify audits", "Product catalog ads", "Profitability tracking", "Seasonal campaigns"] },
      { number: "03", title: "Tracking, Analytics & Reporting", blurb: "Clean tracking and plain-language reporting across Meta, CAPI, GA4 and Google Tag Manager.", features: ["Pixel, CAPI, GA4 and Tag Manager", "Custom dashboards", "Monthly reports and next steps"] },
    ],
  },
  {
    id: "technology",
    index: "03",
    label: "Web Experiences",
    intro: "Fast, focused pages make sure every campaign sends traffic to an experience built to convert.",
    items: [
      { number: "01", title: "Website Design & Landing Pages", blurb: "Fast, mobile-first business websites and landing pages for Shopify and WordPress, with speed, tracking and SEO basics included.", features: ["Business and brand websites", "High-converting landing pages", "Shopify and WordPress builds", "Speed, tracking and SEO basics"] },
      { number: "02", title: "CRM & Automation", blurb: "Connect your leads, sales team and follow-up flows so every enquiry is captured, qualified and handled consistently.", features: ["CRM setup and pipeline management", "Lead routing and assignment", "WhatsApp, email and SMS follow-up", "Sales and reporting automation"] },
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
    title: "Discover",
    description: "We learn your business, margins, customers and goals.",
  },
  {
    number: "02",
    title: "Plan",
    description: "You get a clear strategy covering channels, budget, creative and targets.",
  },
  {
    number: "03",
    title: "Launch",
    description: "We build campaigns and tracking properly from day one.",
  },
  {
    number: "04",
    title: "Optimize",
    description: "Daily monitoring and weekly testing keep results improving.",
  },
  {
    number: "05",
    title: "Report & Scale",
    description: "You see transparent results, then we scale what works.",
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
