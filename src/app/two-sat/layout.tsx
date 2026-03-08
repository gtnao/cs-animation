import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="2-SAT" slug="two-sat" basePath="/two-sat">
      {children}
    </AlgorithmLayout>
  );
}
