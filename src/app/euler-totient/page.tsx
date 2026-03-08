import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";

export default async function Page() {
  const { content, frontmatter } = await renderMarkdown(
    "euler-totient/article.md"
  );

  return (
    <ArticleRenderer
      content={content}
      title={(frontmatter.title as string) || "オイラーのφ関数"}
    />
  );
}
