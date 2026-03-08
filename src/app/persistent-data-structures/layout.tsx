import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="永続データ構造" slug="persistent-data-structures" basePath="/persistent-data-structures">
      {children}
    </AlgorithmLayout>
  );
}
