import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function ZetaMobiusTransformArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "zeta-mobius-transform/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/zeta-mobius-transform"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 高速ゼータ変換 / メビウス変換
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={
          (frontmatter.title as string) || "高速ゼータ変換 / メビウス変換"
        }
      />
    </>
  );
}
