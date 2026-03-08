import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="行列累乗" slug="matrix-exponentiation" basePath="/matrix-exponentiation">
      {children}
    </AlgorithmLayout>
  );
}
