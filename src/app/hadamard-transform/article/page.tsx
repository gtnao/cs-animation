import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function HadamardTransformArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "hadamard-transform/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/hadamard-transform"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Hadamard変換 (XOR畳み込み)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={
          (frontmatter.title as string) || "Hadamard変換 (XOR畳み込み)"
        }
      />
    </>
  );
}
