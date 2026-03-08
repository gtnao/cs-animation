import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function ExtGCDArticlePage() {
  const { content, frontmatter } = await renderMarkdown("ext-gcd/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/ext-gcd"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 拡張ユークリッドの互除法
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "拡張ユークリッドの互除法"}
      />
    </>
  );
}
