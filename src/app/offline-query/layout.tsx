import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Offline Query" slug="offline-query" basePath="/offline-query">
      {children}
    </AlgorithmLayout>
  );
}
