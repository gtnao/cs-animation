import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="橋・関節点検出" slug="bridges-articulation" basePath="/bridges-articulation">
      {children}
    </AlgorithmLayout>
  );
}
