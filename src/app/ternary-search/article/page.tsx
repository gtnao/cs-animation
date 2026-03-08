import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function TernarySearchArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "ternary-search/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/ternary-search"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 三分探索
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "三分探索"}
      />
    </>
  );
}
