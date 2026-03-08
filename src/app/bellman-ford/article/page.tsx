import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BellmanFordArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "bellman-ford/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/bellman-ford"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Bellman-Ford法
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Bellman-Ford法"}
      />
    </>
  );
}
