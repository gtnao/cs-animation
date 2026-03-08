import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function RetrogradeAnalysisArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "retrograde-analysis/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/retrograde-analysis"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 後退解析 (Retrograde Analysis)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "後退解析 (Retrograde Analysis)"}
      />
    </>
  );
}
