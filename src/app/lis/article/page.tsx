import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function LISArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "lis/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/lis"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 最長増加部分列 (LIS)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "最長増加部分列 (LIS)"}
      />
    </>
  );
}
