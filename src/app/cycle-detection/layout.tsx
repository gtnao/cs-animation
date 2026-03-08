import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="サイクル検出" slug="cycle-detection" basePath="/cycle-detection">
      {children}
    </AlgorithmLayout>
  );
}
