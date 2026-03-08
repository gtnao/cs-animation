import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function MatroidIntersectionArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "matroid-intersection/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/matroid-intersection"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Matroid Intersection
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Matroid Intersection"}
      />
    </>
  );
}
