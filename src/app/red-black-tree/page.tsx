import Link from "next/link";

export default function RedBlackTreePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-2">赤黒木</h1>
        <p className="text-sm text-muted-foreground mb-8">
          ノードに赤・黒の色を付けて平衡を保つ自己平衡二分探索木
        </p>
        <div className="space-y-2">
          <Link
            href="/red-black-tree/animation"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">アニメーション</h2>
            <p className="text-sm text-muted-foreground">
              ステップ実行でアルゴリズムの動作を可視化
            </p>
          </Link>
          <Link
            href="/red-black-tree/article"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">解説記事</h2>
            <p className="text-sm text-muted-foreground">
              アルゴリズムの原理と正当性を詳しく解説
            </p>
          </Link>
        </div>
        <div className="mt-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
