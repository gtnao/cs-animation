import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function GomoryHuArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "gomory-hu/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/gomory-hu"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Gomory-Hu Tree
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Gomory-Hu Tree"}
      />
    </>
  );
}
