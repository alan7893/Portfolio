import type { MetadataRoute } from "next";

/** Public crawler file. Must stay outside the login wall in middleware. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
