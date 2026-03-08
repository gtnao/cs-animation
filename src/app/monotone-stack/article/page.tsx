import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function MonotoneStackArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "monotone-stack/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/monotone-stack"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Monotone Stack
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Monotone Stack"}
      />
    </>
  );
}
