import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function FPSArticlePage() {
  const { content, frontmatter } = await renderMarkdown("fps/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/fps"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← FPS (形式的べき級数)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "FPS (形式的べき級数)"}
      />
    </>
  );
}
