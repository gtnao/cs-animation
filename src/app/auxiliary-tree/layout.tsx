import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Auxiliary Tree (Virtual Tree)" slug="auxiliary-tree" basePath="/auxiliary-tree">
      {children}
    </AlgorithmLayout>
  );
}
