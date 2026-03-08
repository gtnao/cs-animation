import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function CycleDetectionArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "cycle-detection/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/cycle-detection"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← サイクル検出
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "サイクル検出"}
      />
    </>
  );
}
