import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function RadixSortArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "radix-sort/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/radix-sort"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Radix Sort
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Radix Sort"}
      />
    </>
  );
}
