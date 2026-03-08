import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function DfsArticlePage() {
  const { content, frontmatter } = await renderMarkdown("dfs/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/dfs"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← DFS (深さ優先探索)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "DFS (深さ優先探索)"}
      />
    </>
  );
}
