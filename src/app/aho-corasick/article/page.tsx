import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function AhoCorasickArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "aho-corasick/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/aho-corasick"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Aho-Corasick法
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Aho-Corasick法"}
      />
    </>
  );
}
