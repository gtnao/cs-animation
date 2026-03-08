import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="回転キャリパー法" slug="rotating-calipers" basePath="/rotating-calipers">
      {children}
    </AlgorithmLayout>
  );
}
