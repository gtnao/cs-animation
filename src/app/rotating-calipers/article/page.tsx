import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function RotatingCalipersArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "rotating-calipers/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/rotating-calipers"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 回転キャリパー法
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "回転キャリパー法"}
      />
    </>
  );
}
