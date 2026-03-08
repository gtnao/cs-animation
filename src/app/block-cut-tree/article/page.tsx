import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BlockCutTreeArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "block-cut-tree/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/block-cut-tree"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Block Cut Tree
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Block Cut Tree"}
      />
    </>
  );
}
