import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function LiChaoTreeArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "li-chao-tree/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/li-chao-tree"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Li Chao Tree
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Li Chao Tree"}
      />
    </>
  );
}
