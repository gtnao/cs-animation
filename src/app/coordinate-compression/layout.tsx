import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="座標圧縮" slug="coordinate-compression" basePath="/coordinate-compression">
      {children}
    </AlgorithmLayout>
  );
}
