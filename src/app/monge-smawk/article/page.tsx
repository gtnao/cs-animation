import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function MongeSMAWKArticlePage() {
  const { content, frontmatter } = await renderMarkdown("monge-smawk/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link href="/monge-smawk" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Monge性とSMAWK
        </Link>
      </div>
      <ArticleRenderer content={content} title={(frontmatter.title as string) || "Monge性とSMAWK"} />
    </>
  );
}
