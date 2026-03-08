import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function PersistentDataStructuresArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "persistent-data-structures/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/persistent-data-structures"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 永続データ構造全般
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "永続データ構造全般"}
      />
    </>
  );
}
