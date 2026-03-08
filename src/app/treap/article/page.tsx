import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function TreapArticlePage() {
  const { content, frontmatter } = await renderMarkdown("treap/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/treap"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Treap
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Treap"}
      />
    </>
  );
}
