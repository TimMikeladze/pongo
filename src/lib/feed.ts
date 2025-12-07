import type { Dashboard, FeedItem } from "./types";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateRss(
  dashboard: Dashboard,
  baseUrl: string,
  items: FeedItem[]
): string {
  const feedUrl = `${baseUrl}/dashboards/shared/${dashboard.slug}/feed.xml`;
  const siteUrl = `${baseUrl}/dashboards/shared/${dashboard.slug}`;

  const itemsXml = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="false">${escapeXml(item.id)}</guid>
      <pubDate>${item.timestamp.toUTCString()}</pubDate>
      <description>${escapeXml(item.description)}</description>
      <category>${escapeXml(item.type)}</category>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(dashboard.name)} - Status Updates</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Status updates for ${escapeXml(dashboard.name)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;
}

export function generateAtom(
  dashboard: Dashboard,
  baseUrl: string,
  items: FeedItem[]
): string {
  const feedUrl = `${baseUrl}/dashboards/shared/${dashboard.slug}/feed.atom`;
  const siteUrl = `${baseUrl}/dashboards/shared/${dashboard.slug}`;

  const entriesXml = items
    .map(
      (item) => `  <entry>
    <title>${escapeXml(item.title)}</title>
    <link href="${escapeXml(item.link)}"/>
    <id>${escapeXml(item.id)}</id>
    <updated>${item.timestamp.toISOString()}</updated>
    <summary>${escapeXml(item.description)}</summary>
    <category term="${escapeXml(item.type)}"/>
  </entry>`
    )
    .join("\n");

  const updated = items[0]?.timestamp || new Date();

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(dashboard.name)} - Status Updates</title>
  <link href="${escapeXml(siteUrl)}"/>
  <link href="${escapeXml(feedUrl)}" rel="self" type="application/atom+xml"/>
  <id>${escapeXml(siteUrl)}</id>
  <updated>${updated.toISOString()}</updated>
  <subtitle>Status updates for ${escapeXml(dashboard.name)}</subtitle>
${entriesXml}
</feed>`;
}
