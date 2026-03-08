import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function LCPArrayArticlePage() {
  const { content, frontmatter } = await renderMarkdown("lcp-array/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/lcp-array"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← LCP Array (Kasai)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "LCP Array (Kasai)"}
      />
    </>
  );
}
