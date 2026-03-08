import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function ClosestPairArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "closest-pair/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/closest-pair"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 最近点対 (Closest Pair)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "最近点対 (Closest Pair)"}
      />
    </>
  );
}
