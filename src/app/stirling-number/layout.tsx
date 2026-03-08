import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="スターリング数" slug="stirling-number" basePath="/stirling-number">
      {children}
    </AlgorithmLayout>
  );
}
