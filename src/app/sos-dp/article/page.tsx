import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function SOSDPArticlePage() {
  const { content, frontmatter } = await renderMarkdown("sos-dp/article.md");

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link href="/sos-dp" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← SOS DP
        </Link>
      </div>
      <ArticleRenderer content={content} title={(frontmatter.title as string) || "SOS DP"} />
    </>
  );
}
