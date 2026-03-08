import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Multipoint Evaluation" slug="multipoint-evaluation" basePath="/multipoint-evaluation">
      {children}
    </AlgorithmLayout>
  );
}
