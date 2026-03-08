import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function ConvexHullArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "convex-hull/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/convex-hull"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 凸包 (Convex Hull)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "凸包 (Convex Hull)"}
      />
    </>
  );
}
