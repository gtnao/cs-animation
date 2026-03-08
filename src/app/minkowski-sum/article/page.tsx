import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function MinkowskiSumArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "minkowski-sum/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/minkowski-sum"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← ミンコフスキー和
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "ミンコフスキー和"}
      />
    </>
  );
}
