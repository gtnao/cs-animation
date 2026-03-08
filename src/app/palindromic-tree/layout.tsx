import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Palindromic Tree (Eertree)" slug="palindromic-tree" basePath="/palindromic-tree">
      {children}
    </AlgorithmLayout>
  );
}
