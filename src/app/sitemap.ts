import type { MetadataRoute } from "next";
import { getDashboards } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://pongo.sh";

  // Static pages (only publicly accessible, non-blocked-by-robots.txt pages)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];

  // Dynamic public dashboard pages
  const dashboards = await getDashboards();
  const publicDashboards = dashboards.filter((d) => d.isPublic);

  const dynamicRoutes: MetadataRoute.Sitemap = publicDashboards.map(
    (dashboard) => ({
      url: `${baseUrl}/shared/${dashboard.slug}`,
      lastModified: new Date(dashboard.updatedAt || dashboard.createdAt),
      changeFrequency: "daily",
      priority: 0.7,
    }),
  );

  return [...staticRoutes, ...dynamicRoutes];
}
