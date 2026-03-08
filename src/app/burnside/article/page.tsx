import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BurnsideArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "burnside/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/burnside"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← バーンサイドの補題
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "バーンサイドの補題"}
      />
    </>
  );
}
