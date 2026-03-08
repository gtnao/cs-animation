import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Heavy-Light Decomposition" slug="hld" basePath="/hld">
      {children}
    </AlgorithmLayout>
  );
}
