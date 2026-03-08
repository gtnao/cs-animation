import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function LazySegmentTreeArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "lazy-segment-tree/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/lazy-segment-tree"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 遅延評価セグメント木
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "遅延評価セグメント木"}
      />
    </>
  );
}
