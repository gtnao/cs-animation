import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function EulerPathArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "euler-path/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/euler-path"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← オイラー路・オイラー閉路
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "オイラー路・オイラー閉路"}
      />
    </>
  );
}
