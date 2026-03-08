import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function SegmentTreeArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "segment-tree/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/segment-tree"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← セグメント木
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "セグメント木"}
      />
    </>
  );
}
