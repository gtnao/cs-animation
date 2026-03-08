import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="FPS (形式的べき級数)" slug="fps" basePath="/fps">
      {children}
    </AlgorithmLayout>
  );
}
