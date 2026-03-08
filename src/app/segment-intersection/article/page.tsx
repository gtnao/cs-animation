import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function SegmentIntersectionArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "segment-intersection/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/segment-intersection"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 線分交差判定
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "線分交差判定"}
      />
    </>
  );
}
