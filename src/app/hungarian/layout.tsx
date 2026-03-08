import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="二部マッチング (Hungarian)" slug="hungarian" basePath="/hungarian">
      {children}
    </AlgorithmLayout>
  );
}
