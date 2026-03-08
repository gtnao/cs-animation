import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function RunLengthEncodingArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "run-length-encoding/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/run-length-encoding"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← ランレングス圧縮
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "ランレングス圧縮"}
      />
    </>
  );
}
