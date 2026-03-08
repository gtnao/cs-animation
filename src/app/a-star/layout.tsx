import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="A*探索" slug="a-star" basePath="/a-star">
      {children}
    </AlgorithmLayout>
  );
}
