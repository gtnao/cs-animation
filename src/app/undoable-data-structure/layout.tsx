import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Undo可能データ構造" slug="undoable-data-structure" basePath="/undoable-data-structure">
      {children}
    </AlgorithmLayout>
  );
}
