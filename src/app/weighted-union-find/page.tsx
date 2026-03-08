import Link from "next/link";

export default function WeightedUnionFindPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-2">重み付き Union-Find</h1>
        <p className="text-sm text-muted-foreground mb-8">
          要素間の相対的な重み (差分) を管理できる Union-Find
        </p>
        <div className="space-y-2">
          <Link
            href="/weighted-union-find/animation"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">アニメーション</h2>
            <p className="text-sm text-muted-foreground">
              ステップ実行でデータ構造の動作を可視化
            </p>
          </Link>
          <Link
            href="/weighted-union-find/article"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">解説記事</h2>
            <p className="text-sm text-muted-foreground">
              データ構造の原理と実装を詳しく解説
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
