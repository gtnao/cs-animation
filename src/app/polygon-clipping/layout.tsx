import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="凸多角形の切断" slug="polygon-clipping" basePath="/polygon-clipping">
      {children}
    </AlgorithmLayout>
  );
}
