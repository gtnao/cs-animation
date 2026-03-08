import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="平方分割" slug="sqrt-decomposition" basePath="/sqrt-decomposition">
      {children}
    </AlgorithmLayout>
  );
}
