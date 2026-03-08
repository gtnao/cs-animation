import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function ConvexHullTrickArticlePage() {
  const { content, frontmatter } = await renderMarkdown("convex-hull-trick/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link href="/convex-hull-trick" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Convex Hull Trick
        </Link>
      </div>
      <ArticleRenderer content={content} title={(frontmatter.title as string) || "Convex Hull Trick"} />
    </>
  );
}
