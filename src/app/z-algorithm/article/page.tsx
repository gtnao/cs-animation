import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function ZAlgorithmArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "z-algorithm/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/z-algorithm"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Z-Algorithm
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Z-Algorithm"}
      />
    </>
  );
}
