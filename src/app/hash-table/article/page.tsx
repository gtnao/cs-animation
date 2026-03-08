import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function HashTableArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "hash-table/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/hash-table"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Hash Table
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Hash Table"}
      />
    </>
  );
}
