import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="行列積" slug="matrix-multiplication" basePath="/matrix-multiplication">
      {children}
    </AlgorithmLayout>
  );
}
