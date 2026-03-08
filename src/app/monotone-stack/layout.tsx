import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Monotone Stack" slug="monotone-stack" basePath="/monotone-stack">
      {children}
    </AlgorithmLayout>
  );
}
