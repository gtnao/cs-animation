import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function LARSCHArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "larsch/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/larsch"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← LARSCH Algorithm
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "LARSCH Algorithm"}
      />
    </>
  );
}
