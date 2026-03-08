import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="最小カット" slug="min-cut" basePath="/min-cut">
      {children}
    </AlgorithmLayout>
  );
}
