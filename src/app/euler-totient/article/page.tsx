import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function EulerTotientArticlePage() {
  const { content, frontmatter } = await renderMarkdown("euler-totient/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/euler-totient"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← オイラーのφ関数
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "オイラーのφ関数"}
      />
    </>
  );
}
