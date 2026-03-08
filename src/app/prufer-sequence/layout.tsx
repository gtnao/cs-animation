import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Prüfer Sequence" slug="prufer-sequence" basePath="/prufer-sequence">
      {children}
    </AlgorithmLayout>
  );
}
