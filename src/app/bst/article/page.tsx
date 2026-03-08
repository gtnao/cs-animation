import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BSTArticlePage() {
  const { content, frontmatter } = await renderMarkdown("bst/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/bst"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 二分探索木 (BST)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "二分探索木 (BST)"}
      />
    </>
  );
}
