import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="オイラー路・オイラー閉路" slug="euler-path" basePath="/euler-path">
      {children}
    </AlgorithmLayout>
  );
}
