import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="フロアサム (Floor Sum)" slug="pollard-rho" basePath="/pollard-rho">
      {children}
    </AlgorithmLayout>
  );
}
