import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function RandomizedArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "randomized/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/randomized"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Randomized Algorithm (乱択)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Randomized Algorithm (乱択)"}
      />
    </>
  );
}
