import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function RedBlackTreeArticlePage() {
  const { content, frontmatter } = await renderMarkdown("red-black-tree/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/red-black-tree"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 赤黒木
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "赤黒木"}
      />
    </>
  );
}
