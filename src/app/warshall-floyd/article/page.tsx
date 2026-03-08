import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function WarshallFloydArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "warshall-floyd/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/warshall-floyd"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Warshall-Floyd法
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Warshall-Floyd法"}
      />
    </>
  );
}
