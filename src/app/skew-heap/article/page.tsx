import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function SkewHeapArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "skew-heap/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/skew-heap"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Skew Heap
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Skew Heap"}
      />
    </>
  );
}
