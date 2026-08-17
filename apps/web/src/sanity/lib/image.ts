import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { client } from "./client";

const builder = imageUrlBuilder(client);

export function sanityImage(source: SanityImageSource) {
  return builder.image(source);
}
