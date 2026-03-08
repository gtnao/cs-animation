import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function MillerRabinArticlePage() {
  const { content, frontmatter } = await renderMarkdown("miller-rabin/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/miller-rabin"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Miller-Rabin 素数判定
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Miller-Rabin 素数判定"}
      />
    </>
  );
}
