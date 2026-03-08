import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Interval Tree" slug="interval-tree" basePath="/interval-tree">
      {children}
    </AlgorithmLayout>
  );
}
