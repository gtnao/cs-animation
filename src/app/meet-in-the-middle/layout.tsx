import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="半分全列挙" slug="meet-in-the-middle" basePath="/meet-in-the-middle">
      {children}
    </AlgorithmLayout>
  );
}
