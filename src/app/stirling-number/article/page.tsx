import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function StirlingNumberArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "stirling-number/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/stirling-number"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← スターリング数
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "スターリング数"}
      />
    </>
  );
}
