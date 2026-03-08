import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function CRTArticlePage() {
  const { content, frontmatter } = await renderMarkdown("crt/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/crt"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 中国剰余定理 (CRT)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "中国剰余定理 (CRT)"}
      />
    </>
  );
}
