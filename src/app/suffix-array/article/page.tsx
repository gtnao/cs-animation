import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function SuffixArrayArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "suffix-array/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/suffix-array"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Suffix Array
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Suffix Array"}
      />
    </>
  );
}
