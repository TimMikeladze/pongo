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
