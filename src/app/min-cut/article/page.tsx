import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function MinCutArticlePage() {
  const { content, frontmatter } = await renderMarkdown("min-cut/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/min-cut"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 最小カット
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "最小カット"}
      />
    </>
  );
}
