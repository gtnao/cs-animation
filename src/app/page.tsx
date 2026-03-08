import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">CS Animation</h1>
        <p className="text-muted-foreground mb-8">
          アルゴリズムをインタラクティブに学ぶ
        </p>
        {/* 文字列 */}
        <h2 className="text-xl font-bold mt-8 mb-3">文字列</h2>
        <div className="space-y-2">
          <Link
            href="/z-algorithm"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Z-Algorithm</h2>
            <p className="text-sm text-muted-foreground">
              文字列の各位置における最長共通接頭辞の長さを求める
            </p>
          </Link>
        </div>

        {/* グラフ（木・連結性） */}
        <h2 className="text-xl font-bold mt-8 mb-3">グラフ（木・連結性）</h2>
        <div className="space-y-2">
          <Link
            href="/kruskal"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Kruskal法</h2>
            <p className="text-sm text-muted-foreground">
              辺を重みの昇順に追加して最小全域木を構築する
            </p>
          </Link>
          <Link
            href="/prim"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Prim法</h2>
            <p className="text-sm text-muted-foreground">
              頂点を成長させて最小全域木を構築する
            </p>
          </Link>
          <Link
            href="/boruvka"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Borůvka法</h2>
            <p className="text-sm text-muted-foreground">
              各連結成分の最小辺を同時選択して最小全域木を構築する
            </p>
          </Link>
          <Link
            href="/topological-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">トポロジカルソート</h2>
            <p className="text-sm text-muted-foreground">
              DAGの頂点を依存関係に従って順序付ける
            </p>
          </Link>
          <Link
            href="/scc-tarjan"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">強連結成分分解 (Tarjan)</h2>
            <p className="text-sm text-muted-foreground">
              DFS 1回で有向グラフの強連結成分を求める
            </p>
          </Link>
          <Link
            href="/scc-kosaraju"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">強連結成分分解 (Kosaraju)</h2>
            <p className="text-sm text-muted-foreground">
              2回のDFSで有向グラフの強連結成分を求める
            </p>
          </Link>
          <Link
            href="/two-edge-cc"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">二重辺連結成分分解</h2>
            <p className="text-sm text-muted-foreground">
              橋を除去して二重辺連結成分に分解する
            </p>
          </Link>
          <Link
            href="/biconnected-components"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">二重頂点連結成分分解</h2>
            <p className="text-sm text-muted-foreground">
              関節点で分割して二重頂点連結成分に分解する
            </p>
          </Link>
          <Link
            href="/bridges-articulation"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">橋・関節点検出</h2>
            <p className="text-sm text-muted-foreground">
              グラフの橋と関節点をDFSで検出する
            </p>
          </Link>
          <Link
            href="/euler-path"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">オイラー路・オイラー閉路</h2>
            <p className="text-sm text-muted-foreground">
              全辺を1度ずつ通るパスまたは閉路を求める
            </p>
          </Link>
          <Link
            href="/hamiltonian-path"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">ハミルトン路 (DP)</h2>
            <p className="text-sm text-muted-foreground">
              ビットマスクDPで全頂点を1度ずつ通るパスを求める
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
