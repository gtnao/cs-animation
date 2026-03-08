import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function PersistentArrayArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "persistent-array/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/persistent-array"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Persistent Array
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Persistent Array"}
      />
    </>
  );
}
