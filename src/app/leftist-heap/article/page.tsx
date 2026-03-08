import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function LeftistHeapArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "leftist-heap/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/leftist-heap"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Leftist Heap
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Leftist Heap"}
      />
    </>
  );
}
