import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function ArticlePage() {
  const { content, frontmatter } = await renderMarkdown("booth/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/booth"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Minimum Rotation (Booth)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Minimum Rotation (Booth)"}
      />
    </>
  );
}
