import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function GCDArticlePage() {
  const { content, frontmatter } = await renderMarkdown("gcd/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/gcd"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← ユークリッドの互除法
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "ユークリッドの互除法"}
      />
    </>
  );
}
