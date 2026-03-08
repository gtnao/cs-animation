import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Stack" slug="stack" basePath="/stack">
      {children}
    </AlgorithmLayout>
  );
}
