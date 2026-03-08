import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function InclusionExclusionArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "inclusion-exclusion/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/inclusion-exclusion"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 包除原理
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "包除原理"}
      />
    </>
  );
}
