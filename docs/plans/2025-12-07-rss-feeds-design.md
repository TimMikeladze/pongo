# RSS Feeds for Public Dashboards - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add RSS 2.0 and Atom feeds to public dashboards combining alert events, incidents, and announcements.

**Architecture:** Route handlers at `/dashboards/shared/{slug}/feed.xml` and `/feed.atom` fetch unified feed items from a new data layer function, then generate XML using hand-built generators.

**Tech Stack:** Next.js route handlers, existing Drizzle data layer, hand-crafted XML generation.

---

## Task 1: Add FeedItem Type

**Files:**
- Modify: `src/lib/types.ts:109` (end of file)

**Step 1: Add FeedItem interface**

Add to end of `src/lib/types.ts`:

```typescript
export interface FeedItem {
  id: string;
  type: "alert" | "incident" | "announcement";
  title: string;
  description: string;
  link: string;
  timestamp: Date;
}
```

**Step 2: Verify build**

Run: `bunx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(feed): add FeedItem type"
```

---

## Task 2: Add getFeedItems Function

**Files:**
- Modify: `src/lib/data.ts` (add import, add function at end)

**Step 1: Add FeedItem to imports**

In `src/lib/data.ts`, update the imports from `./types` to include `FeedItem`:

```typescript
import type {
  Announcement,
  CheckResult,
  Dashboard,
  FeedItem,
  Incident,
  MaintenanceWindow,
  Monitor,
  MonitorStatus,
} from "./types";
```

**Step 2: Add getFeedItems function**

Add at end of `src/lib/data.ts`:

```typescript
export async function getFeedItems(
  dashboardId: string,
  monitorIds: string[],
  baseUrl: string,
  slug: string,
  limit = 50
): Promise<FeedItem[]> {
  const items: FeedItem[] = [];

  // Get alert events for dashboard monitors (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const alertEvents = await getAlertEvents({
    from: thirtyDaysAgo,
    to: new Date(),
  });

  for (const event of alertEvents) {
    if (!monitorIds.includes(event.monitorId)) continue;

    const eventType = event.eventType === "fired" ? "fired" : "resolved";
    items.push({
      id: `alert-${event.id}`,
      type: "alert",
      title: `${event.monitorName}: ${event.alertName} ${eventType}`,
      description: event.snapshot
        ? `Status: ${(event.snapshot as Record<string, unknown>).status || "unknown"}`
        : `Alert ${eventType}`,
      link: `${baseUrl}/dashboards/shared/${slug}#monitor-${event.monitorId}`,
      timestamp: event.eventType === "fired" ? event.triggeredAt : (event.resolvedAt || event.triggeredAt),
    });
  }

  // Get incidents for dashboard
  const incidents = await getIncidents(dashboardId);
  for (const incident of incidents) {
    const latestUpdate = incident.updates[0];
    items.push({
      id: `incident-${incident.id}`,
      type: "incident",
      title: `[${incident.severity.toUpperCase()}] ${incident.title}`,
      description: latestUpdate?.message || incident.title,
      link: `${baseUrl}/dashboards/shared/${slug}#incident-${incident.id}`,
      timestamp: new Date(incident.resolvedAt || incident.createdAt),
    });
  }

  // Get announcements for dashboard
  const announcements = await getAnnouncements(dashboardId);
  for (const announcement of announcements) {
    items.push({
      id: `announcement-${announcement.id}`,
      type: "announcement",
      title: announcement.title,
      description: announcement.message,
      link: `${baseUrl}/dashboards/shared/${slug}#announcement-${announcement.id}`,
      timestamp: new Date(announcement.createdAt),
    });
  }

  // Sort by timestamp descending and limit
  return items
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}
```

**Step 3: Verify build**

Run: `bunx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/data.ts
git commit -m "feat(feed): add getFeedItems function"
```

---

## Task 3: Create Feed XML Generators

**Files:**
- Create: `src/lib/feed.ts`

**Step 1: Create feed.ts with both generators**

Create `src/lib/feed.ts`:

```typescript
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
```

**Step 2: Verify build**

Run: `bunx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/feed.ts
git commit -m "feat(feed): add RSS and Atom XML generators"
```

---

## Task 4: Create RSS Route Handler

**Files:**
- Create: `src/app/dashboards/shared/[slug]/feed.xml/route.ts`

**Step 1: Create route handler**

Create `src/app/dashboards/shared/[slug]/feed.xml/route.ts`:

```typescript
import { getDashboardBySlug, getFeedItems } from "@/lib/data";
import { generateRss } from "@/lib/feed";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);

  if (!dashboard || !dashboard.isPublic) {
    return new Response("Not Found", { status: 404 });
  }

  const baseUrl = new URL(request.url).origin;
  const items = await getFeedItems(
    dashboard.id,
    dashboard.monitorIds,
    baseUrl,
    slug
  );

  return new Response(generateRss(dashboard, baseUrl, items), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
```

**Step 2: Verify build**

Run: `bunx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/dashboards/shared/[slug]/feed.xml/route.ts
git commit -m "feat(feed): add RSS feed route handler"
```

---

## Task 5: Create Atom Route Handler

**Files:**
- Create: `src/app/dashboards/shared/[slug]/feed.atom/route.ts`

**Step 1: Create route handler**

Create `src/app/dashboards/shared/[slug]/feed.atom/route.ts`:

```typescript
import { getDashboardBySlug, getFeedItems } from "@/lib/data";
import { generateAtom } from "@/lib/feed";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);

  if (!dashboard || !dashboard.isPublic) {
    return new Response("Not Found", { status: 404 });
  }

  const baseUrl = new URL(request.url).origin;
  const items = await getFeedItems(
    dashboard.id,
    dashboard.monitorIds,
    baseUrl,
    slug
  );

  return new Response(generateAtom(dashboard, baseUrl, items), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
```

**Step 2: Verify build**

Run: `bunx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/dashboards/shared/[slug]/feed.atom/route.ts
git commit -m "feat(feed): add Atom feed route handler"
```

---

## Task 6: Manual Verification

**Step 1: Start dev server**

Run: `bun run dev`

**Step 2: Test RSS feed**

Open: `http://localhost:3000/dashboards/shared/{your-slug}/feed.xml`
Expected: Valid RSS 2.0 XML with feed items

**Step 3: Test Atom feed**

Open: `http://localhost:3000/dashboards/shared/{your-slug}/feed.atom`
Expected: Valid Atom XML with feed items

**Step 4: Test 404 for non-public dashboard**

If you have a non-public dashboard, verify it returns 404.

**Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(feed): address verification issues"
```
