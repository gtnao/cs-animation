import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function KruskalArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "kruskal/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/kruskal"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Kruskal法
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Kruskal法"}
      />
    </>
  );
}
