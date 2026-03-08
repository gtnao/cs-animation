import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function GoldenSectionSearchArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "golden-section-search/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/golden-section-search"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 黄金分割探索
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "黄金分割探索"}
      />
    </>
  );
}
