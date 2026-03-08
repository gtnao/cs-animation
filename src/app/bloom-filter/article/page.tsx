import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BloomFilterArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "bloom-filter/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/bloom-filter"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Bloom Filter
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Bloom Filter"}
      />
    </>
  );
}
