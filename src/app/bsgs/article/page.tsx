import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BSGSArticlePage() {
  const { content, frontmatter } = await renderMarkdown("bsgs/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/bsgs"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Baby-step Giant-step
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "離散対数 (Baby-step Giant-step)"}
      />
    </>
  );
}
