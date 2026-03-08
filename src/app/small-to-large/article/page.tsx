import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function SmallToLargeArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "small-to-large/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/small-to-large"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← マージテク (Small to Large)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "マージテク (Small to Large)"}
      />
    </>
  );
}
