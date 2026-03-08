import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function TimSortArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "tim-sort/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/tim-sort"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Tim Sort
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Tim Sort"}
      />
    </>
  );
}
