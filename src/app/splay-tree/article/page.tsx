import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function SplayTreeArticlePage() {
  const { content, frontmatter } = await renderMarkdown("splay-tree/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/splay-tree"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Splay木
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Splay木"}
      />
    </>
  );
}
