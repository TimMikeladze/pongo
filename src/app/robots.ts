import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://pongo.sh";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboards/",
        "/monitors/",
        "/settings/",
        "/alerts",
        "/login",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
