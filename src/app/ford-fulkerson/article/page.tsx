import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function FordFulkersonArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "ford-fulkerson/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/ford-fulkerson"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Ford-Fulkerson
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Ford-Fulkerson"}
      />
    </>
  );
}
