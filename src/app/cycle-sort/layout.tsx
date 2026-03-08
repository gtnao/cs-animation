import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Cycle Sort" slug="cycle-sort" basePath="/cycle-sort">
      {children}
    </AlgorithmLayout>
  );
}
