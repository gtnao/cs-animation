import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="行列累乗 DP" slug="matrix-exponentiation-dp" basePath="/matrix-exponentiation-dp">
      {children}
    </AlgorithmLayout>
  );
}
