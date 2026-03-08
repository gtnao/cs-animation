import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function SternBrocotArticlePage() {
  const { content, frontmatter } = await renderMarkdown("stern-brocot/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/stern-brocot"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Stern-Brocot Tree
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Stern-Brocot Tree"}
      />
    </>
  );
}
