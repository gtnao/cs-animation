import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function AStarArticlePage() {
  const { content, frontmatter } = await renderMarkdown("a-star/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/a-star"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← A*探索
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "A*探索"}
      />
    </>
  );
}
