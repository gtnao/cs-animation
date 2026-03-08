import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BellNumberArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "bell-number/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/bell-number"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← ベル数
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "ベル数"}
      />
    </>
  );
}
