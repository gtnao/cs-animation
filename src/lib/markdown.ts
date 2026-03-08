import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import type { Root, Element, Text } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

// Extract mermaid code blocks before rehype-pretty-code processes them
const rehypeMermaidPlaceholder: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (
        node.tagName === "pre" &&
        node.children.length === 1 &&
        (node.children[0] as Element).tagName === "code"
      ) {
        const codeNode = node.children[0] as Element;
        const className =
          (codeNode.properties?.className as string[]) || [];
        if (className.includes("language-mermaid")) {
          const code = codeNode.children
            .filter((c): c is Text => c.type === "text")
            .map((c) => c.value)
            .join("");
          node.tagName = "div";
          node.properties = {
            "data-mermaid": "true",
            "data-chart": code,
          };
          node.children = [];
        }
      }
    });
  };
};

export interface MarkdownResult {
  content: string;
  frontmatter: Record<string, unknown>;
}

export async function renderMarkdown(
  relativePath: string
): Promise<MarkdownResult> {
  const fullPath = path.join(
    process.cwd(),
    "src",
    "content",
    relativePath
  );
  const raw = fs.readFileSync(fullPath, "utf-8");
  const { data: frontmatter, content: markdownContent } = matter(raw);

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeMermaidPlaceholder)
    .use(rehypePrettyCode, {
      theme: "github-light",
      keepBackground: false,
    })
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(markdownContent);

  return {
    content: String(result),
    frontmatter,
  };
}
