import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Persistent Array" slug="persistent-array" basePath="/persistent-array">
      {children}
    </AlgorithmLayout>
  );
}
