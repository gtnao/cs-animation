import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BitmaskDPArticlePage() {
  const { content, frontmatter } = await renderMarkdown("bitmask-dp/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link href="/bitmask-dp" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← ビットDP
        </Link>
      </div>
      <ArticleRenderer content={content} title={(frontmatter.title as string) || "ビットDP"} />
    </>
  );
}
