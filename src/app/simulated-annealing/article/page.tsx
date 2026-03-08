import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function SimulatedAnnealingArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "simulated-annealing/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/simulated-annealing"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 焼きなまし法
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "焼きなまし法"}
      />
    </>
  );
}
