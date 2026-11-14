import { menuLinks } from "@/data/home";
import { websiteCopy } from "@/data/website-copy";
import type { Field, SectionData, SectionDef } from "./schema";

/**
 * Pages that can be edited in Admin > Pages & content.
 *
 * To make another page editable (for example Services or Portfolio):
 *   1. add an entry here,
 *   2. add its sections to EXTRA_SECTIONS below (each with `page: "<id>"` and defaults),
 *   3. make the page component read them with `useSection("<key>")` (see AboutPage for the pattern),
 *   4. optionally give its route a `head()` built with `pageHead(root, "<key>_seo", ...)`.
 * No database change is needed: content is stored per section key in content_drafts / content_published.
 */
export type EditorPage = { id: string; label: string; path: string; description: string };

export const EDITOR_PAGES: EditorPage[] = [
  { id: "home", label: "Home page", path: "/", description: "Every section of the home page." },
  { id: "about", label: "About page", path: "/about", description: "Story, values, FAQ and the call to action on /about." },
  { id: "contact", label: "Contact page", path: "/contact", description: "Contact details and the inquiry form on /contact." },
  { id: "site", label: "Menu & footer", path: "/", description: "The menu, header button and footer shown on every page." },
];

const text = (name: string, label: string, max: number, help?: string): Field => ({ name, label, type: "text", max, ...(help ? { help } : {}) });
const area = (name: string, label: string, max: number, help?: string): Field => ({ name, label, type: "textarea", max, ...(help ? { help } : {}) });
const link = (name: string, label: string, help?: string): Field => ({ name, label, type: "url", ...(help ? { help } : {}) });
const LINK_HELP = "A path such as /contact, a full https:// address, #section, mailto: or tel:.";

function seoFields(): Field[] {
  return [
    text("title", "Page title (search results and browser tab)", 70, "Keep under 60 characters."),
    area("description", "Search description", 320, "Aim for 140 to 160 characters."),
    link("og_image", "Social share image", "Shown when the page is shared. Optional."),
  ];
}

export const EXTRA_SECTIONS: SectionDef[] = [
  // ------------------------------------------------------------------ site-wide
  {
    key: "site_nav",
    page: "site",
    label: "Menu & header button",
    description: "The words and links in the main menu, the footer menu and the button at the top right of every page.",
    toggleable: false,
    fields: [
      {
        name: "items",
        label: "Menu links",
        type: "list",
        itemLabel: "Menu link",
        max: 8,
        fields: [
          text("name", "Link text", 30),
          text("detail", "Short description (tooltip)", 80),
          link("url", "Link to", LINK_HELP),
        ],
      },
      text("cta_label", "Header button text", 30),
      link("cta_url", "Header button link", LINK_HELP),
    ],
  },

  // ------------------------------------------------------------------ about page
  { key: "about_seo", page: "about", label: "Search & sharing", description: "How the About page appears in Google and when shared.", toggleable: false, fields: seoFields() },
  {
    key: "about_hero",
    page: "about",
    label: "Top banner",
    description: "The large heading at the top of the About page.",
    toggleable: false,
    fields: [text("eyebrow", "Small label", 80), text("title", "Heading", 120), area("description", "Subheading", 400)],
  },
  {
    key: "about_story",
    page: "about",
    label: "Our story",
    description: "The picture-and-text block under the banner.",
    toggleable: true,
    fields: [
      text("label", "Small label", 60),
      text("heading_1", "Heading line 1", 60),
      text("heading_2", "Heading line 2", 60),
      area("text", "Paragraph", 900),
      { name: "disciplines", label: "Numbered list", type: "strings", help: "One item per line." },
      text("caption", "Picture caption", 80),
      text("link_label", "Link text", 50),
      link("link_url", "Link to", LINK_HELP),
    ],
  },
  {
    key: "about_intro",
    page: "about",
    label: "Welcome & why choose us",
    description: "The welcome text with three reasons to choose the agency.",
    toggleable: true,
    fields: [
      text("label", "Small label", 60),
      text("heading", "Heading", 120),
      area("intro", "Introduction", 1200),
      {
        name: "cards",
        label: "Reason cards",
        type: "list",
        itemLabel: "Card",
        max: 6,
        fields: [text("title", "Title", 60), area("body", "Text", 300)],
      },
    ],
  },
  {
    key: "about_mission",
    page: "about",
    label: "Our mission",
    description: "Mission heading and paragraphs.",
    toggleable: true,
    fields: [
      text("label", "Small label", 60),
      text("heading", "Heading", 120),
      { name: "paragraphs", label: "Paragraphs", type: "list", itemLabel: "Paragraph", max: 10, fields: [area("text", "Text", 800)] },
    ],
  },
  {
    key: "about_values",
    page: "about",
    label: "Vision, mission & support",
    description: "The four-column block (vision, mission, support, awards).",
    toggleable: true,
    fields: [
      text("eyebrow", "Small label", 60),
      text("title", "Heading", 120),
      area("text", "Introduction", 400),
      {
        name: "items",
        label: "Columns",
        type: "list",
        itemLabel: "Column",
        max: 6,
        fields: [text("title", "Title", 60), area("body", "Text", 300)],
      },
    ],
  },
  {
    key: "about_cta",
    page: "about",
    label: "Call to action banner",
    description: "The coloured banner with a button.",
    toggleable: true,
    fields: [text("eyebrow", "Small label", 60), text("heading", "Heading", 100), text("button_label", "Button text", 40), link("button_url", "Button link", LINK_HELP)],
  },
  {
    key: "about_faq",
    page: "about",
    label: "FAQs",
    description: "Questions and answers on the About page. A question without an answer is shown as a plain line.",
    toggleable: true,
    fields: [
      text("eyebrow", "Small label", 60),
      text("heading", "Heading", 100),
      {
        name: "items",
        label: "Questions",
        type: "list",
        itemLabel: "Question",
        max: 30,
        fields: [text("question", "Question", 200), area("answer", "Answer", 1500, "Optional. With an answer the question can be opened.")],
      },
      text("prompt", "Sentence before the link", 80, "For example: Have another question?"),
      text("link_label", "Link text", 40, "The linked words at the end of the sentence."),
      link("link_url", "Link to", LINK_HELP),
    ],
  },

  // ------------------------------------------------------------------ contact page
  { key: "contact_seo", page: "contact", label: "Search & sharing", description: "How the Contact page appears in Google and when shared.", toggleable: false, fields: seoFields() },
  {
    key: "contact_hero",
    page: "contact",
    label: "Top banner",
    description: "The large heading at the top of the Contact page.",
    toggleable: false,
    fields: [text("eyebrow", "Small label", 80), text("title", "Heading", 80), area("description", "Subheading", 400)],
  },
  {
    key: "contact_details",
    page: "contact",
    label: "Details beside the form",
    description: "Wording next to the form. The email, phones and address come from Menu & footer > Footer & contact details.",
    toggleable: false,
    fields: [
      text("art_label", "Panel label", 40),
      text("art_line_1", "Panel heading line 1", 40),
      text("art_line_2", "Panel heading line 2", 40),
      text("art_line_3", "Panel heading line 3 (highlighted)", 40),
      text("reach_label", "Label above the email", 60),
      text("whatsapp_label", "WhatsApp link text", 40),
      link("whatsapp_url", "WhatsApp link", "For example https://wa.me/923272514632"),
      {
        name: "info",
        label: "Information blocks",
        type: "list",
        itemLabel: "Block",
        max: 4,
        fields: [text("title", "Title", 80), area("text", "Text", 300)],
      },
    ],
  },
  {
    key: "inquiry_form",
    page: "contact",
    label: "Inquiry form wording",
    description: "The text of the inquiry form. It is used on the Contact page and on the home page.",
    toggleable: false,
    fields: [
      text("eyebrow", "Small label", 40),
      text("heading", "Heading", 100),
      { name: "services", label: "Area of interest choices", type: "strings", help: "One choice per line. The first line is selected by default." },
      text("submit_label", "Send button text", 30),
      text("reply_note", "Note next to the button", 100),
      text("success_title", "Thank-you heading", 60),
      area("success_text", "Thank-you message", 300),
      text("success_button", "Thank-you button text", 40),
    ],
  },
];

/** Built-in wording. These reproduce the pages exactly as they were before they became editable. */
export const EXTRA_DEFAULTS: Record<string, SectionData> = {
  site_nav: {
    items: menuLinks.map((m) => ({ name: m.name, detail: m.detail, url: m.target })),
    cta_label: "Let's talk",
    cta_url: "/contact",
  },

  about_seo: {
    title: "About ReckoMEDIA",
    description: "About ReckoMEDIA: your trusted partner in digital marketing. Personalized strategies, data-driven campaigns and reliable execution.",
    og_image: "",
  },
  about_hero: {
    eyebrow: "About / ReckoMEDIA",
    title: "Your trusted partner in the digital marketing jungle.",
    description:
      "Your brand deserves a megaphone, not a whisper. We are your experienced guide and strategic partner, leading you through the digital wilderness and helping you conquer the peaks of online success.",
  },
  about_story: {
    label: "Our story",
    heading_1: "A passion for",
    heading_2: "social media.",
    text: "We saw businesses struggling to navigate the ever-changing landscape and knew there was a better way to unlock the transformative power of social media. ReckoMEDIA is driven by experienced digital strategists, creative storytellers and data wizards, dedicated to helping businesses achieve their online goals, from growing brand awareness to generating leads and boosting sales.",
    disciplines: ["Social media advertising", "Search and SEO", "Web design"],
    caption: "Different disciplines. One direction.",
    link_label: "Explore our services",
    link_url: "/services",
  },
  about_intro: {
    label: "Welcome to Recko Media",
    heading: "Achieve your digital goals with our social media marketing agency.",
    intro: websiteCopy.intro,
    cards: [
      { title: "Why Choose Us", body: websiteCopy.why },
      { title: "Affordable Price For You", body: websiteCopy.price },
      { title: "Best Strategy", body: websiteCopy.strategy },
    ],
  },
  about_mission: {
    label: "Our Mission",
    heading: "Empowering small businesses through social media mastery.",
    paragraphs: websiteCopy.mission.map((paragraph) => ({ text: paragraph })),
  },
  about_values: {
    eyebrow: "Vision, mission and support",
    title: "Excellence, learning and support.",
    text: "We never settle; we continuously monitor and adjust your campaigns to maximize your ROI and stay ahead of the curve.",
    items: [
      { title: "Our vision", body: "We redefine digital marketing, delivering exceptional results globally with a focus on excellence." },
      { title: "Our mission", body: "Empower digital success through proven methods and continuous learning." },
      { title: "Our support", body: "Contact us on WhatsApp and Instagram. We are here to help you and grow your business." },
      { title: "Our awards", body: "We are certified with Meta Advertising and also with Google Advertising." },
    ],
  },
  about_cta: {
    eyebrow: "Contact us",
    heading: "Craft your unique digital story.",
    button_label: "Start a conversation",
    button_url: "/contact",
  },
  about_faq: {
    eyebrow: "FAQs",
    heading: "Frequently Asked Questions",
    // Only the fourth question had an answer on the old page; the others are plain lines until an answer is added.
    items: websiteCopy.questions.map((question, index) => ({ question, answer: index === 3 ? websiteCopy.faqAnswer : "" })),
    prompt: "Have another question?",
    link_label: "Contact Us",
    link_url: "/contact",
  },

  contact_seo: {
    title: "Contact ReckoMEDIA",
    description: "Reach out to ReckoMEDIA to grow your online presence. Social media advertising, SEO and web design from Karachi.",
    og_image: "",
  },
  contact_hero: {
    eyebrow: "Contact / Start the conversation",
    title: "Get In Touch",
    description: "Ready to take the next step? Let’s chat about how Recko Media can craft a winning digital marketing strategy that ignites your online presence.",
  },
  contact_details: {
    art_label: "Your next chapter",
    art_line_1: "Big idea?",
    art_line_2: "Small question?",
    art_line_3: "Start here.",
    reach_label: "Reach the team",
    whatsapp_label: "Chat on WhatsApp",
    whatsapp_url: "https://wa.me/923272514632",
    info: [
      {
        title: "Need advice to grow your business?",
        text: "Digital marketing helps businesses reach and connect with their audience online, paving the way for success in a competitive market.",
      },
      { title: "Working together", text: "Find us in Gulshan-e-Iqbal, Karachi, Pakistan." },
    ],
  },
  inquiry_form: {
    eyebrow: "Project inquiry",
    heading: "What would you like to make happen?",
    services: [
      "Not sure yet",
      "Social media advertising",
      "Search engine optimization",
      "Search engine marketing / Google Ads",
      "Website design & development",
      "Something else",
    ],
    submit_label: "Send inquiry",
    reply_note: "We reply to every inquiry personally.",
    success_title: "Message received.",
    success_text: "Thank you. We have your inquiry and will reply personally, usually within one working day.",
    success_button: "Send another message",
  },
};
