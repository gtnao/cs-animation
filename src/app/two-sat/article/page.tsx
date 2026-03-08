import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function TwoSatArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "two-sat/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/two-sat"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 2-SAT
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "2-SAT"}
      />
    </>
  );
}
