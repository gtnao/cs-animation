import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function EulerTourArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "euler-tour/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/euler-tour"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Euler Tour
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Euler Tour"}
      />
    </>
  );
}
