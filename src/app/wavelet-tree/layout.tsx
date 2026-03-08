import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Wavelet Tree" slug="wavelet-tree" basePath="/wavelet-tree">
      {children}
    </AlgorithmLayout>
  );
}
