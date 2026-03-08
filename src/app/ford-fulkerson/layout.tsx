import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="最大フロー (Ford-Fulkerson)" slug="ford-fulkerson" basePath="/ford-fulkerson">
      {children}
    </AlgorithmLayout>
  );
}
