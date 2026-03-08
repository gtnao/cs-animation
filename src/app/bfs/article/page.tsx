import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BfsArticlePage() {
  const { content, frontmatter } = await renderMarkdown("bfs/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/bfs"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← BFS (幅優先探索)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "BFS (幅優先探索)"}
      />
    </>
  );
}
