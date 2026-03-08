import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function PancakeSortArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "pancake-sort/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/pancake-sort"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Pancake Sort
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Pancake Sort"}
      />
    </>
  );
}
