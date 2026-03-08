"use client";

import { useEffect, useRef } from "react";
import { MermaidDiagram } from "./mermaid-diagram";
import { createRoot } from "react-dom/client";

interface ArticleRendererProps {
  content: string;
  title?: string;
}

export function ArticleRenderer({ content, title }: ArticleRendererProps) {
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!articleRef.current) return;

    const mermaidDivs = articleRef.current.querySelectorAll(
      "[data-mermaid]"
    );
    mermaidDivs.forEach((div) => {
      const chart = div.getAttribute("data-chart") || "";
      const container = document.createElement("div");
      div.replaceWith(container);
      const root = createRoot(container);
      root.render(<MermaidDiagram chart={chart} />);
    });
  }, [content]);

  return (
    <article>
      {title && <h1 className="text-3xl font-bold mb-8">{title}</h1>}
      <div
        ref={articleRef}
        className="article-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
}
