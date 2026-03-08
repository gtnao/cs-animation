import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function DigitDPArticlePage() {
  const { content, frontmatter } = await renderMarkdown("digit-dp/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link href="/digit-dp" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← 桁DP
        </Link>
      </div>
      <ArticleRenderer content={content} title={(frontmatter.title as string) || "桁DP"} />
    </>
  );
}
