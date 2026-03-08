import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function PruferSequenceArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "prufer-sequence/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/prufer-sequence"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Prufer Sequence
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Prufer Sequence"}
      />
    </>
  );
}
