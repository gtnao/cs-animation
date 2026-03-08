import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function OfflineDynamicConnectivityArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "offline-dynamic-connectivity/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/offline-dynamic-connectivity"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← オフライン削除 (Offline Dynamic Connectivity)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "オフライン削除 (Offline Dynamic Connectivity)"}
      />
    </>
  );
}
