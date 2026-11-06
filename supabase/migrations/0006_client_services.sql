-- Replace the live service list with the client's services (Social Media / Search / Web).
-- Old services are set to draft (hidden, not deleted) so nothing is lost and they can be restored in the admin.

update public.services set status = 'draft'
 where slug in ('branding-identity','content-production','social-media-management','social-media-advertising',
                'search-engine-optimization','search-engine-marketing','website-design-development',
                'ecommerce-solutions','ai-automation');

insert into public.services (slug, category, title, summary, status, sort_order) values
  ('facebook-ads','creative','Facebook Ads','Reach your ideal audience, increase brand awareness and drive conversions with targeted Facebook ad campaigns.','published',1),
  ('instagram-ads','creative','Instagram Ads','From stunning visuals to compelling storytelling, campaigns that inspire, engage and convert your audience.','published',2),
  ('youtube-ads','creative','YouTube Ads','Capture the attention of millions with compelling video ads that connect and convert potential customers.','published',3),
  ('seo','growth','Search Engine Optimization','Increase your website''s visibility and ranking through strategic optimization. Drive organic traffic with tailored SEO solutions.','published',1),
  ('sem','growth','Search Engine Marketing','Achieve instant visibility through targeted pay-per-click campaigns. Maximize your ROI and reach your audience effectively.','published',2),
  ('google-ads','growth','Google Ads','Tailored Google Ads campaigns that drive targeted traffic, generate leads and grow sales.','published',3),
  ('web-design-development','technology','Website Design & Development','Dynamic, user-friendly websites that represent your brand, drive traffic and generate leads.','published',1),
  ('wordpress','technology','WordPress Website','Custom WordPress development: responsive, dynamic websites tailored to your unique business needs.','published',2),
  ('shopify','technology','Shopify Website','Take your online store to the next level with visually striking sites, seamless functionality and easy inventory management.','published',3)
on conflict (slug) do update set
  category = excluded.category, title = excluded.title, summary = excluded.summary,
  status = 'published', sort_order = excluded.sort_order;
