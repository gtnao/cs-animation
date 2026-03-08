import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function FibonacciHeapArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "fibonacci-heap/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/fibonacci-heap"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Fibonacci Heap
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Fibonacci Heap"}
      />
    </>
  );
}
