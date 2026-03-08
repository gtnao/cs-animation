import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function OfflineQueryArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "offline-query/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/offline-query"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Offline Query (クエリ先読み)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Offline Query (クエリ先読み)"}
      />
    </>
  );
}
