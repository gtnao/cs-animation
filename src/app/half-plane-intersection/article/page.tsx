import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function HalfPlaneIntersectionArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "half-plane-intersection/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/half-plane-intersection"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 半平面交差
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "半平面交差"}
      />
    </>
  );
}
