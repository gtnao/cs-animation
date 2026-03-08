import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="三分探索" slug="ternary-search" basePath="/ternary-search">
      {children}
    </AlgorithmLayout>
  );
}
