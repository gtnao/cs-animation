import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Minimax / Alpha-Beta剪定" slug="minimax-alpha-beta" basePath="/minimax-alpha-beta">
      {children}
    </AlgorithmLayout>
  );
}
