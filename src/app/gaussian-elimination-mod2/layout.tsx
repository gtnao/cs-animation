import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="ガウスの消去法 (mod 2)" slug="gaussian-elimination-mod2" basePath="/gaussian-elimination-mod2">
      {children}
    </AlgorithmLayout>
  );
}
