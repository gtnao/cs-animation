import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Warshall-Floyd法" slug="warshall-floyd" basePath="/warshall-floyd">
      {children}
    </AlgorithmLayout>
  );
}
