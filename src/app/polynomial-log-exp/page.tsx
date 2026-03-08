import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";

export default async function Page() {
  const { content, frontmatter } = await renderMarkdown(
    "polynomial-log-exp/article.md"
  );

  return (
    <ArticleRenderer
      content={content}
      title={(frontmatter.title as string) || "多項式の対数・指数"}
    />
  );
}
