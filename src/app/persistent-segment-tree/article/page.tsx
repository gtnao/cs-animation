import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function PersistentSegmentTreeArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "persistent-segment-tree/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/persistent-segment-tree"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 永続セグメント木
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "永続セグメント木"}
      />
    </>
  );
}
