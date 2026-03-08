import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="ハミルトン路 (DP)" slug="hamiltonian-path" basePath="/hamiltonian-path">
      {children}
    </AlgorithmLayout>
  );
}
