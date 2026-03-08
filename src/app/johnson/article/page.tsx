import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function JohnsonArticlePage() {
  const { content, frontmatter } = await renderMarkdown("johnson/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/johnson"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Johnson&apos;s Algorithm
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Johnson's Algorithm"}
      />
    </>
  );
}
