import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Manacher's Algorithm" slug="manacher" basePath="/manacher">
      {children}
    </AlgorithmLayout>
  );
}
