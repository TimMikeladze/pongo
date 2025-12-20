import type { MetadataRoute } from "next";
import { getDashboards } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://pongo.sh";

  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/monitors`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/dashboards`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
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
