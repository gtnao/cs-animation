import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="黄金分割探索" slug="golden-section-search" basePath="/golden-section-search">
      {children}
    </AlgorithmLayout>
  );
}
