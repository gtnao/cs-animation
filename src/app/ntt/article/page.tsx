import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function NTTArticlePage() {
  const { content, frontmatter } = await renderMarkdown("ntt/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/ntt"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← NTT (数論変換)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "NTT (数論変換)"}
      />
    </>
  );
}
