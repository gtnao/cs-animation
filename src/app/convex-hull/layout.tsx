import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="凸包" slug="convex-hull" basePath="/convex-hull">
      {children}
    </AlgorithmLayout>
  );
}
