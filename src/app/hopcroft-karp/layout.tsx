import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="二部マッチング (Hopcroft-Karp)" slug="hopcroft-karp" basePath="/hopcroft-karp">
      {children}
    </AlgorithmLayout>
  );
}
