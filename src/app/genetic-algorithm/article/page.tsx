import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function GeneticAlgorithmArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "genetic-algorithm/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/genetic-algorithm"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 遺伝的アルゴリズム
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "遺伝的アルゴリズム"}
      />
    </>
  );
}
