import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Mo's Algorithm" slug="mos-algorithm" basePath="/mos-algorithm">
      {children}
    </AlgorithmLayout>
  );
}
