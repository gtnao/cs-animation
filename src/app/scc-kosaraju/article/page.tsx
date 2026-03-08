import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function SccKosarajuArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "scc-kosaraju/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/scc-kosaraju"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 強連結成分分解 (Kosaraju)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "強連結成分分解 (Kosaraju)"}
      />
    </>
  );
}
