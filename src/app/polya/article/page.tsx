import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function PolyaArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "polya/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/polya"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← ポリアの数え上げ定理
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "ポリアの数え上げ定理"}
      />
    </>
  );
}
