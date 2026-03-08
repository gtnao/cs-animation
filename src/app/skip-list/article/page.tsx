import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function SkipListArticlePage() {
  const { content, frontmatter } = await renderMarkdown("skip-list/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/skip-list"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Skip List
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Skip List"}
      />
    </>
  );
}
