import type { MetadataRoute } from "next";
import { SITE_BASE_PATH, SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: `${SITE_BASE_PATH}/`,
      disallow: [
        `${SITE_BASE_PATH}/admin`,
        `${SITE_BASE_PATH}/mon-compte`,
        `${SITE_BASE_PATH}/mes-favoris`,
        `${SITE_BASE_PATH}/api/`,
        `${SITE_BASE_PATH}/*draft*`,
        `${SITE_BASE_PATH}/*preview*`,
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
