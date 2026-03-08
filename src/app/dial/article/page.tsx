import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function DialArticlePage() {
  const { content, frontmatter } = await renderMarkdown("dial/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/dial"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Dial&apos;s Algorithm
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Dial's Algorithm"}
      />
    </>
  );
}
