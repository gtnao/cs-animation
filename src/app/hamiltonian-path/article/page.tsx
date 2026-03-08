import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function HamiltonianPathArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "hamiltonian-path/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/hamiltonian-path"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← ハミルトン路 DP
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "ハミルトン路 DP"}
      />
    </>
  );
}
