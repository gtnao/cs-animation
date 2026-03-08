import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BinarySearchArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "binary-search/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/binary-search"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 二分探索
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "二分探索"}
      />
    </>
  );
}
