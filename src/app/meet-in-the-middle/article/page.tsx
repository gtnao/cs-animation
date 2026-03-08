import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function MeetInTheMiddleArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "meet-in-the-middle/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/meet-in-the-middle"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 半分全列挙
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "半分全列挙 (Meet in the Middle)"}
      />
    </>
  );
}
