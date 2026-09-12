import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Crawlers need to read pages to see their noindex directive during review.
  return { rules: { userAgent: "*", allow: "/" } };
}
