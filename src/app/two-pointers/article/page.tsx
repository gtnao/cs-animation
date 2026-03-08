import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function TwoPointersArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "two-pointers/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/two-pointers"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← しゃくとり法 (Two Pointers)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "しゃくとり法 (Two Pointers)"}
      />
    </>
  );
}
