import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function PruningSearchArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "pruning-search/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/pruning-search"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 枝刈り全探索
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "枝刈り全探索"}
      />
    </>
  );
}
