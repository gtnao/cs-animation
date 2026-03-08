import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function HLDArticlePage() {
  const { content, frontmatter } = await renderMarkdown("hld/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/hld"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Heavy-Light Decomposition
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Heavy-Light Decomposition"}
      />
    </>
  );
}
