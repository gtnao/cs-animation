import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Convex Hull Trick" slug="convex-hull-trick" basePath="/convex-hull-trick">
      {children}
    </AlgorithmLayout>
  );
}
