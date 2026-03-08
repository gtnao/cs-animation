import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="二重辺連結成分分解" slug="two-edge-cc" basePath="/two-edge-cc">
      {children}
    </AlgorithmLayout>
  );
}
