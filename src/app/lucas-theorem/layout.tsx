import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Lucasの定理" slug="lucas-theorem" basePath="/lucas-theorem">
      {children}
    </AlgorithmLayout>
  );
}
