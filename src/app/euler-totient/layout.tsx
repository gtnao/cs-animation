import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="離散対数 (Baby-step Giant-step)" slug="euler-totient" basePath="/euler-totient">
      {children}
    </AlgorithmLayout>
  );
}
