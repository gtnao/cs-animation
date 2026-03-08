import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BlossomArticlePage() {
  const { content, frontmatter } = await renderMarkdown("blossom/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/blossom"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Edmonds&apos; Blossom
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Edmonds' Blossom Algorithm"}
      />
    </>
  );
}
