import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function UndoableDataStructureArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "undoable-data-structure/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/undoable-data-structure"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Undo可能データ構造
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Undo可能データ構造"}
      />
    </>
  );
}
