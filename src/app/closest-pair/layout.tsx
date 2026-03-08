import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="最近点対" slug="closest-pair" basePath="/closest-pair">
      {children}
    </AlgorithmLayout>
  );
}
