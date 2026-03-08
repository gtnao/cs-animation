import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function LagrangeInterpolationArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "lagrange-interpolation/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/lagrange-interpolation"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← ラグランジュ補間
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "ラグランジュ補間"}
      />
    </>
  );
}
