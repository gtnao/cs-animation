import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function DijkstraArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "dijkstra/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/dijkstra"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Dijkstra法
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Dijkstra法"}
      />
    </>
  );
}
