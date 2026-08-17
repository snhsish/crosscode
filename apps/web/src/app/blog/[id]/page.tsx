import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { sanityFetch } from "@/sanity/lib/live";
import { POST_QUERY } from "@/sanity/lib/queries";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

type Post = {
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  body?: unknown[];
  coverImage?: string;
  coverImageAlt?: string;
  author?: { name?: string; role?: string };
  tags?: string[];
};

const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mb-6 leading-8 text-muted-foreground">{children}</p>,
    h2: ({ children }) => <h2 className="mb-4 mt-12 text-3xl font-semibold tracking-tight text-foreground">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-3 mt-10 text-2xl font-semibold text-foreground">{children}</h3>,
    blockquote: ({ children }) => <blockquote className="my-8 border-l-4 border-primary pl-6 italic text-muted-foreground">{children}</blockquote>,
  },
  marks: {
    link: ({ children, value }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
        {children}
      </a>
    ),
  },
};

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(value));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await sanityFetch({ query: POST_QUERY, params: { slug: id }, stega: false });
  const post = data as Post | null;

  return {
    title: post ? `${post.title} | CrossCode` : "Blog | CrossCode",
    description: post?.excerpt || "CrossCode blog.",
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params;
  const { data } = await sanityFetch({ query: POST_QUERY, params: { slug: id } });
  const post = data as Post | null;

  if (!post) notFound();

  return (
    <article className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">CrossCode journal</p>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground md:text-6xl">{post.title}</h1>
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
          {post.author?.name && <span>By {post.author.name}</span>}
        </div>
        {post.excerpt && <p className="mt-8 text-xl leading-9 text-muted-foreground">{post.excerpt}</p>}
      </div>

      {post.coverImage && (
        <div className="relative mx-auto mt-12 aspect-[2/1] max-w-5xl overflow-hidden rounded-2xl bg-muted">
          <Image src={post.coverImage} alt={post.coverImageAlt || post.title} fill priority className="object-cover" />
        </div>
      )}

      <div className="prose prose-neutral dark:prose-invert mx-auto mt-14 max-w-3xl">
        <PortableText value={post.body || []} components={portableTextComponents} />
      </div>
    </article>
  );
}
