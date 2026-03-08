import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Union-Find" slug="union-find" basePath="/union-find">
      {children}
    </AlgorithmLayout>
  );
}
