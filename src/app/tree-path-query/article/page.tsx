import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function TreePathQueryArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "tree-path-query/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/tree-path-query"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 木上のパスクエリ
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "木上のパスクエリ"}
      />
    </>
  );
}
