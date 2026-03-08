import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";

export default async function Page() {
  const { content, frontmatter } = await renderMarkdown(
    "linear-basis/article.md"
  );

  return (
    <ArticleRenderer
      content={content}
      title={(frontmatter.title as string) || "線形基底 Linear Basis / XOR Basis"}
    />
  );
}
