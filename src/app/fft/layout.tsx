import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="FFT (高速フーリエ変換)" slug="fft" basePath="/fft">
      {children}
    </AlgorithmLayout>
  );
}
