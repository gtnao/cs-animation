import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function ArbitraryModConvolutionArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "arbitrary-mod-convolution/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/arbitrary-mod-convolution"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 任意modでの畳み込み
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "任意modでの畳み込み"}
      />
    </>
  );
}
