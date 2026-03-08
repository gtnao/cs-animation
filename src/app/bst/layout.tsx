import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="二分探索木 (BST)" slug="bst" basePath="/bst">
      {children}
    </AlgorithmLayout>
  );
}
