import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Dial's Algorithm" slug="dial" basePath="/dial">
      {children}
    </AlgorithmLayout>
  );
}
