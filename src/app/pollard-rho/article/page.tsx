import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function PollardRhoArticlePage() {
  const { content, frontmatter } = await renderMarkdown("pollard-rho/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/pollard-rho"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Pollard&apos;s rho 法
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Pollard's rho 法"}
      />
    </>
  );
}
