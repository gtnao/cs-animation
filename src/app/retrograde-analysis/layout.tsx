import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="後退解析" slug="retrograde-analysis" basePath="/retrograde-analysis">
      {children}
    </AlgorithmLayout>
  );
}
