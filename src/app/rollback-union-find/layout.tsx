import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Rollback可能Union-Find" slug="rollback-union-find" basePath="/rollback-union-find">
      {children}
    </AlgorithmLayout>
  );
}
