import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="最大フロー (Dinic)" slug="dinic" basePath="/dinic">
      {children}
    </AlgorithmLayout>
  );
}
