import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function LinkedListArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "linked-list/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/linked-list"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Linked List
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Linked List"}
      />
    </>
  );
}
