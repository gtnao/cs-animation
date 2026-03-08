import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function GaussianEliminationMod2ArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "gaussian-elimination-mod2/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/gaussian-elimination-mod2"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← ガウスの消去法 mod 2 ビット
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "ガウスの消去法 mod 2 ビット"}
      />
    </>
  );
}
