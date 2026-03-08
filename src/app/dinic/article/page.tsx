import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function DinicArticlePage() {
  const { content, frontmatter } = await renderMarkdown("dinic/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/dinic"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Dinic法
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Dinic法"}
      />
    </>
  );
}
