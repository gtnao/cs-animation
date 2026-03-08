import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="編集距離 (Levenshtein)" slug="edit-distance" basePath="/edit-distance">
      {children}
    </AlgorithmLayout>
  );
}
