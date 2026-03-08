import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function KnuthOptimizationArticlePage() {
  const { content, frontmatter } = await renderMarkdown("knuth-optimization/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link href="/knuth-optimization" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Knuth's Optimization
        </Link>
      </div>
      <ArticleRenderer content={content} title={(frontmatter.title as string) || "Knuth's Optimization"} />
    </>
  );
}
