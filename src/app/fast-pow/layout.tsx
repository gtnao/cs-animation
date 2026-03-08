import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Miller-Rabin素数判定" slug="fast-pow" basePath="/fast-pow">
      {children}
    </AlgorithmLayout>
  );
}
