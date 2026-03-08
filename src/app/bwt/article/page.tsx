import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function ArticlePage() {
  const { content, frontmatter } = await renderMarkdown("bwt/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/bwt"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Burrows-Wheeler Transform
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Burrows-Wheeler Transform"}
      />
    </>
  );
}
