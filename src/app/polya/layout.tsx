import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="ポリアの数え上げ定理" slug="polya" basePath="/polya">
      {children}
    </AlgorithmLayout>
  );
}
