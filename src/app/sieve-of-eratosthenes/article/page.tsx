import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function SieveArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "sieve-of-eratosthenes/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/sieve-of-eratosthenes"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← エラトステネスの篩
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "エラトステネスの篩"}
      />
    </>
  );
}
