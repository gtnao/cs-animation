import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function AuxiliaryTreeArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "auxiliary-tree/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/auxiliary-tree"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Auxiliary Tree
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Auxiliary Tree"}
      />
    </>
  );
}
