import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function FenwickTree2DArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "fenwick-tree-2d/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/fenwick-tree-2d"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 2次元BIT
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "2次元BIT"}
      />
    </>
  );
}
