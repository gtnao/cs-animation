import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function EditDistanceArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "edit-distance/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/edit-distance"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 編集距離 (Levenshtein)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "編集距離 (Levenshtein)"}
      />
    </>
  );
}
