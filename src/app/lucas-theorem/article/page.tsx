import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function LucasTheoremArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "lucas-theorem/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/lucas-theorem"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Lucasの定理
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Lucasの定理"}
      />
    </>
  );
}
