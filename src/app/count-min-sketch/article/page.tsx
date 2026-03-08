import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function CountMinSketchArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "count-min-sketch/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/count-min-sketch"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Count-Min Sketch
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Count-Min Sketch"}
      />
    </>
  );
}
