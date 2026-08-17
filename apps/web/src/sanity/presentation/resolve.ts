import { defineLocations, type PresentationPluginOptions } from "sanity/presentation";

export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
    post: defineLocations({
      select: { title: "title", slug: "slug.current" },
      resolve: (document) => ({
        locations: [
          { title: document?.title || "Untitled post", href: `/blog/${document?.slug}` },
          { title: "All blog posts", href: "/blog" },
        ],
      }),
    }),
  },
};
