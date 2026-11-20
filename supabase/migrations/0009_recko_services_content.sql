-- Replace the service catalogue with the Recko Media performance marketing offer.
update public.services
set status = 'draft'
where slug not in (
  'meta-ads',
  'lead-generation-campaigns',
  'google-ads',
  'ecommerce-growth',
  'social-media-management',
  'creative-content-production',
  'website-design-landing-pages',
  'crm-automation',
  'tracking-analytics-reporting'
);

insert into public.services (slug, category, title, summary, details, features, status, sort_order) values
  ('meta-ads','creative','Meta Ads (Facebook & Instagram)',
   'Facebook and Instagram campaigns that stop the right people, build demand and turn attention into sales or leads.',
   'We build full-funnel campaigns covering awareness, retargeting and conversion, then test audiences, creatives and offers until the numbers work.',
   array['Campaign strategy and account structure','Audience research, lookalikes and retargeting','Ad creative testing: static, video, carousel and UGC','Pixel, Conversions API and event setup','Weekly optimization and scaling'],'published',1),
  ('lead-generation-campaigns','creative','Lead Generation Campaigns',
   'Real enquiries, not just form fills, with qualifying questions and fast follow-up built into the funnel.',
   'We build lead campaigns that help your sales team spend time on people who are ready to buy.',
   array['Instant forms, WhatsApp and Messenger campaigns','Landing page lead funnels','Lead quality filtering and CRM/Sheets integration','Cost-per-lead and cost-per-customer reporting'],'published',2),
  ('social-media-management','creative','Social Media Management',
   'A consistent, active brand without you having to think about the day-to-day publishing.',
   'We plan, design and publish content that builds trust and supports your ad campaigns.',
   array['Monthly content calendars','Post and reel design','Captions, hashtags and community management','Page setup and brand optimization'],'published',4),
  ('creative-content-production','creative','Creative & Content Production',
   'Scroll-stopping ads built to convert, not just to look good.',
   'Creative is the biggest lever in paid ads, so we build, test and improve ideas across formats.',
   array['Ad creatives and motion graphics','Short-form video and UGC-style ads','Ad copywriting and hooks','Creative testing frameworks'],'published',3),
  ('google-ads','growth','Google Ads',
   'Put your brand in front of people who are already searching for what you sell.',
   'Search, Shopping and YouTube campaigns are built around real intent and strong conversion tracking.',
   array['Keyword research and search campaigns','Google Shopping and Performance Max','YouTube video ads','Conversion tracking and bid strategy management'],'published',1),
  ('ecommerce-growth','growth','E-commerce Growth',
   'Profitable sales, not vanity ROAS.',
   'We account for product costs, delivery, returns and COD failures and scale only campaigns that make you money.',
   array['Shopify store audits and conversion improvements','Product catalog ads and dynamic retargeting','Profitability tracking by product and campaign','Seasonal sale and launch campaigns'],'published',2),
  ('tracking-analytics-reporting','growth','Tracking, Analytics & Reporting',
   'Clean measurement and plain-language reports that lead to clear next steps.',
   'If you cannot measure it, you cannot grow it. We connect data and reporting without drowning you in vanity metrics.',
   array['Meta Pixel, CAPI, GA4 and Google Tag Manager setup','Custom performance dashboards','Monthly reports with clear next steps'],'published',3),
  ('website-design-landing-pages','technology','Website Design & Landing Pages',
   'Fast, mobile-first websites and landing pages built to turn visitors into customers.',
   'Your ads are only as good as the page they send people to, so we make the full journey work together.',
   array['Business and brand websites','High-converting landing pages','Shopify and WordPress builds','Speed, tracking and SEO basics included'],'published',1),
  ('crm-automation','technology','CRM & Automation',
   'Connect your leads, sales team and follow-up flows so every enquiry is handled consistently.',
   'We set up practical CRM and automation workflows that help qualified leads move faster and keep your pipeline visible.',
   array['CRM setup and pipeline management','Lead routing and assignment','WhatsApp, email and SMS follow-up','Sales and reporting automation'],'published',2)
on conflict (slug) do update set
  category = excluded.category,
  title = excluded.title,
  summary = excluded.summary,
  details = excluded.details,
  features = excluded.features,
  status = 'published',
  sort_order = excluded.sort_order;

update public.content_published
set data = data || '{
  "eyebrow": "What we do",
  "heading": "Ads that sell. Growth you can measure.",
  "subheading": "Recko Media helps brands grow with performance marketing, social media and data-driven creative. We plan it, run it, track it and keep improving it.",
  "creative_intro": "We stop the scroll, turn attention into enquiries and give every campaign a clear role.",
  "growth_intro": "We connect intent, profitability and data so growth is measurable and repeatable.",
  "technology_intro": "Fast, focused pages make sure every campaign sends traffic to an experience built to convert."
}'::jsonb
where key = 'services_intro';

update public.content_drafts
set data = data || '{
  "eyebrow": "What we do",
  "heading": "Ads that sell. Growth you can measure.",
  "subheading": "Recko Media helps brands grow with performance marketing, social media and data-driven creative. We plan it, run it, track it and keep improving it.",
  "creative_intro": "We stop the scroll, turn attention into enquiries and give every campaign a clear role.",
  "growth_intro": "We connect intent, profitability and data so growth is measurable and repeatable.",
  "technology_intro": "Fast, focused pages make sure every campaign sends traffic to an experience built to convert."
}'::jsonb
where key = 'services_intro';
