import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";

export default async function Page() {
  const { content, frontmatter } = await renderMarkdown(
    "bwt/article.md"
  );

  return (
    <ArticleRenderer
      content={content}
      title={(frontmatter.title as string) || "Burrows-Wheeler Transform"}
    />
  );
}
