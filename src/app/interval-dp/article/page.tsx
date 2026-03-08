import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function IntervalDPArticlePage() {
  const { content, frontmatter } = await renderMarkdown("interval-dp/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link href="/interval-dp" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← 区間DP
        </Link>
      </div>
      <ArticleRenderer content={content} title={(frontmatter.title as string) || "区間DP"} />
    </>
  );
}
