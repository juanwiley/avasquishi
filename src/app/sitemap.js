// Served at /sitemap.xml — static pages plus every active product.
import { getCatalog } from "@/lib/catalog";

export const revalidate = 3600;

const SITE_URL = "https://www.avasquishi.com";

const STATIC_PAGES = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/products", priority: 0.9, changeFrequency: "daily" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
  { path: "/shipping", priority: 0.4, changeFrequency: "monthly" },
  { path: "/refunds", priority: 0.4, changeFrequency: "monthly" },
  { path: "/safety", priority: 0.4, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap() {
  const now = new Date();
  const entries = STATIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  for (const p of await getCatalog()) {
    if (!p.path) continue;
    entries.push({
      url: `${SITE_URL}${p.path}`,
      lastModified: p.createdAt ? new Date(p.createdAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }
  return entries;
}
