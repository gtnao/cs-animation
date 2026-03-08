import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function FastPowArticlePage() {
  const { content, frontmatter } = await renderMarkdown("fast-pow/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/fast-pow"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 高速べき乗
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "高速べき乗 (繰り返し二乗法)"}
      />
    </>
  );
}
