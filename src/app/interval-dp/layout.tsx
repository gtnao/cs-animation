import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="区間DP" slug="interval-dp" basePath="/interval-dp">
      {children}
    </AlgorithmLayout>
  );
}
