import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function RollbackUnionFindArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "rollback-union-find/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/rollback-union-find"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Rollback可能Union-Find
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Rollback可能Union-Find"}
      />
    </>
  );
}
