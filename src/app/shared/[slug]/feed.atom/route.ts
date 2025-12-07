import { getDashboardBySlug, getFeedItems } from "@/lib/data";
import { generateAtom } from "@/lib/feed";

// ISR: Revalidate every 5 minutes
export const revalidate = 300;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
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
    slug,
  );

  return new Response(generateAtom(dashboard, baseUrl, items), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
