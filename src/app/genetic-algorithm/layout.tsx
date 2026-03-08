import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="遺伝的アルゴリズム" slug="genetic-algorithm" basePath="/genetic-algorithm">
      {children}
    </AlgorithmLayout>
  );
}
