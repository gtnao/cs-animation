import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function TreeIsomorphismArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "tree-isomorphism/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/tree-isomorphism"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 木の同型判定
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "木の同型判定"}
      />
    </>
  );
}
