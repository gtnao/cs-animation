import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function LCADoublingArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "lca-doubling/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/lca-doubling"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← LCA - ダブリング
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "LCA - ダブリング"}
      />
    </>
  );
}
