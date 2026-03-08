import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Euler Tour" slug="euler-tour" basePath="/euler-tour">
      {children}
    </AlgorithmLayout>
  );
}
