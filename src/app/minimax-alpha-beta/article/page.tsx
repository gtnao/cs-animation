import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function MinimaxAlphaBetaArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "minimax-alpha-beta/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/minimax-alpha-beta"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Minimax / Alpha-Beta剪定
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Minimax / Alpha-Beta剪定"}
      />
    </>
  );
}
