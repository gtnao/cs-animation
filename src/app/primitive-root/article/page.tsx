import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function PrimitiveRootArticlePage() {
  const { content, frontmatter } = await renderMarkdown("primitive-root/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/primitive-root"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 原始根
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "原始根"}
      />
    </>
  );
}
