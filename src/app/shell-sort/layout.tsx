import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Shell Sort" slug="shell-sort" basePath="/shell-sort">
      {children}
    </AlgorithmLayout>
  );
}
