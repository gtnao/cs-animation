import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function MobiusArticlePage() {
  const { content, frontmatter } = await renderMarkdown("mobius/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/mobius"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← メビウス関数
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "メビウス関数・メビウスの反転公式"}
      />
    </>
  );
}
