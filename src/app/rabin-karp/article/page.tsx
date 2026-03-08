import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function ArticlePage() {
  const { content, frontmatter } = await renderMarkdown("rabin-karp/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/rabin-karp"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Rabin-Karp法
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Rabin-Karp法"}
      />
    </>
  );
}
