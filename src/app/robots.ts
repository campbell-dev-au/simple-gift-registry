import type { MetadataRoute } from "next";

// Only the public marketing-ish pages are worth indexing. /share is
// unguessable-token content that still leaks if a link is posted publicly
// (it also sends noindex via metadata and X-Robots-Tag); the rest are
// signed-in pages that would only ever index as redirects.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/share/", "/registries", "/account", "/sso-callback"],
    },
  };
}
