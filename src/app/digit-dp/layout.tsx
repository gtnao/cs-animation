import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="桁DP" slug="digit-dp" basePath="/digit-dp">
      {children}
    </AlgorithmLayout>
  );
}
