import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function FFTArticlePage() {
  const { content, frontmatter } = await renderMarkdown("fft/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/fft"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← FFT (高速フーリエ変換)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "FFT (高速フーリエ変換)"}
      />
    </>
  );
}
