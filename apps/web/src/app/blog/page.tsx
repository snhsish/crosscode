import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { sanityFetch } from "@/sanity/lib/live";
import { POSTS_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Blog | CrossCode",
  description: "Updates, guides, and engineering notes from CrossCode.",
};

export const dynamic = "force-dynamic";

type Post = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  coverImage?: string;
  coverImageAlt?: string;
  author?: { name?: string };
};

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default async function BlogPage() {
  const { data } = await sanityFetch({ query: POSTS_QUERY });
  const posts = (data || []) as Post[];

  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">CrossCode journal</p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">Ideas for building from anywhere.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          Product updates, practical guides, and notes on remote development with AI coding agents.
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary/50"
            >
              {post.coverImage && (
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                  <Image
                    src={post.coverImage}
                    alt={post.coverImageAlt || post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="space-y-4 p-6">
                <p className="text-sm text-muted-foreground">{formatDate(post.publishedAt)}</p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground group-hover:text-primary">{post.title}</h2>
                {post.excerpt && <p className="leading-7 text-muted-foreground">{post.excerpt}</p>}
                {post.author?.name && <p className="text-sm text-muted-foreground">By {post.author.name}</p>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-dashed p-12 text-center">
          <h2 className="text-xl font-semibold text-foreground">The first post is on its way.</h2>
          <p className="mt-2 text-muted-foreground">Create and publish a post in the Sanity Studio to see it here.</p>
          <Link href="/studio" className="mt-6 inline-flex text-sm font-semibold text-primary hover:underline">
            Open Studio
          </Link>
        </div>
      )}
    </section>
  );
}
