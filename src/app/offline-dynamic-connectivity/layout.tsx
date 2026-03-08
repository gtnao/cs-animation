import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="オフライン削除" slug="offline-dynamic-connectivity" basePath="/offline-dynamic-connectivity">
      {children}
    </AlgorithmLayout>
  );
}
