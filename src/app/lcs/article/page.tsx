import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function LCSArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "lcs/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/lcs"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 最長共通部分列 (LCS)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "最長共通部分列 (LCS)"}
      />
    </>
  );
}
