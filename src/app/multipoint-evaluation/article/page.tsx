import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function MultipointEvaluationArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "multipoint-evaluation/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/multipoint-evaluation"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Multipoint Evaluation
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Multipoint Evaluation"}
      />
    </>
  );
}
