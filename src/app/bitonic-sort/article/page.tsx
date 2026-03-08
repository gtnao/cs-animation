import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BitonicSortArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "bitonic-sort/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/bitonic-sort"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Bitonic Sort
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Bitonic Sort"}
      />
    </>
  );
}
