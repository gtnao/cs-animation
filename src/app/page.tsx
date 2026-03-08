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
          <Link
            href="/kmp"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">KMP法</h2>
            <p className="text-sm text-muted-foreground">
              失敗関数を用いた線形時間パターンマッチング
            </p>
          </Link>
          <Link
            href="/aho-corasick"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Aho-Corasick法</h2>
            <p className="text-sm text-muted-foreground">
              複数パターンの同時検索を行うオートマトン
            </p>
          </Link>
          <Link
            href="/suffix-array"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Suffix Array</h2>
            <p className="text-sm text-muted-foreground">
              接尾辞を辞書順にソートした配列
            </p>
          </Link>
          <Link
            href="/sa-is"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Suffix Array (SA-IS)</h2>
            <p className="text-sm text-muted-foreground">
              線形時間でSuffix Arrayを構築する誘導ソート
            </p>
          </Link>
          <Link
            href="/lcp-array"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">LCP Array (Kasai)</h2>
            <p className="text-sm text-muted-foreground">
              隣接接尾辞間の最長共通接頭辞を線形時間で計算
            </p>
          </Link>
          <Link
            href="/suffix-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Suffix Tree</h2>
            <p className="text-sm text-muted-foreground">
              全接尾辞を格納するトライの圧縮版
            </p>
          </Link>
          <Link
            href="/suffix-automaton"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Suffix Automaton</h2>
            <p className="text-sm text-muted-foreground">
              全部分文字列を受理する最小状態オートマトン
            </p>
          </Link>
          <Link
            href="/rolling-hash"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Rolling Hash</h2>
            <p className="text-sm text-muted-foreground">
              部分文字列のハッシュ値を定数時間で更新する
            </p>
          </Link>
          <Link
            href="/rabin-karp"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Rabin-Karp法</h2>
            <p className="text-sm text-muted-foreground">
              ローリングハッシュを使ったパターンマッチング
            </p>
          </Link>
          <Link
            href="/manacher"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Manacher&apos;s Algorithm</h2>
            <p className="text-sm text-muted-foreground">
              各位置を中心とする最長回文の半径を線形時間で求める
            </p>
          </Link>
          <Link
            href="/trie"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Trie</h2>
            <p className="text-sm text-muted-foreground">
              文字列の集合を効率的に格納するトライ木
            </p>
          </Link>
          <Link
            href="/palindromic-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Palindromic Tree (Eertree)</h2>
            <p className="text-sm text-muted-foreground">
              全回文部分文字列を格納するデータ構造
            </p>
          </Link>
          <Link
            href="/bwt"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Burrows-Wheeler Transform</h2>
            <p className="text-sm text-muted-foreground">
              データ圧縮のための可逆的な文字列変換
            </p>
          </Link>
          <Link
            href="/rle"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Run Length Encoding</h2>
            <p className="text-sm text-muted-foreground">
              連続する同一文字をまとめて圧縮する
            </p>
          </Link>
          <Link
            href="/lyndon"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Lyndon Factorization</h2>
            <p className="text-sm text-muted-foreground">
              文字列をLyndon語に分解する
            </p>
          </Link>
          <Link
            href="/booth"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Minimum Rotation (Booth)</h2>
            <p className="text-sm text-muted-foreground">
              辞書順最小の巡回シフトを線形時間で求める
            </p>
          </Link>
        </div>

        {/* ソート */}
        <h2 className="text-xl font-bold mt-8 mb-3">ソート</h2>
        <div className="space-y-2">
          <Link
            href="/bubble-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Bubble Sort</h2>
            <p className="text-sm text-muted-foreground">
              隣接要素を比較・交換して整列する
            </p>
          </Link>
          <Link
            href="/selection-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Selection Sort</h2>
            <p className="text-sm text-muted-foreground">
              最小値を選択して先頭に配置する
            </p>
          </Link>
          <Link
            href="/insertion-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Insertion Sort</h2>
            <p className="text-sm text-muted-foreground">
              要素を適切な位置に挿入して整列する
            </p>
          </Link>
          <Link
            href="/merge-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Merge Sort</h2>
            <p className="text-sm text-muted-foreground">
              分割統治法で安定な整列を行う
            </p>
          </Link>
          <Link
            href="/quick-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Quick Sort</h2>
            <p className="text-sm text-muted-foreground">
              ピボットで分割して高速に整列する
            </p>
          </Link>
          <Link
            href="/heap-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Heap Sort</h2>
            <p className="text-sm text-muted-foreground">
              ヒープ構造を利用してインプレースに整列する
            </p>
          </Link>
          <Link
            href="/counting-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Counting Sort</h2>
            <p className="text-sm text-muted-foreground">
              要素の出現回数を数えて整列する非比較ソート
            </p>
          </Link>
          <Link
            href="/radix-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Radix Sort</h2>
            <p className="text-sm text-muted-foreground">
              桁ごとに安定ソートを繰り返す
            </p>
          </Link>
          <Link
            href="/bucket-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Bucket Sort</h2>
            <p className="text-sm text-muted-foreground">
              バケットに分配して各バケットを整列する
            </p>
          </Link>
          <Link
            href="/shell-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Shell Sort</h2>
            <p className="text-sm text-muted-foreground">
              ギャップを縮小しながら挿入ソートを繰り返す
            </p>
          </Link>
          <Link
            href="/tim-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Tim Sort</h2>
            <p className="text-sm text-muted-foreground">
              実用的な高性能ハイブリッドソート
            </p>
          </Link>
          <Link
            href="/intro-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Intro Sort</h2>
            <p className="text-sm text-muted-foreground">
              Quick Sort + Heap Sort + Insertion Sort のハイブリッド
            </p>
          </Link>
          <Link
            href="/bitonic-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Bitonic Sort</h2>
            <p className="text-sm text-muted-foreground">
              並列計算向けのソーティングネットワーク
            </p>
          </Link>
          <Link
            href="/pancake-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Pancake Sort</h2>
            <p className="text-sm text-muted-foreground">
              先頭からの反転操作のみで整列する
            </p>
          </Link>
          <Link
            href="/cycle-sort"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Cycle Sort</h2>
            <p className="text-sm text-muted-foreground">
              書き込み回数を最小化するインプレースソート
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

        {/* グラフ（探索・最短路） */}
        <h2 className="text-xl font-bold mt-8 mb-3">グラフ（探索・最短路）</h2>
        <div className="space-y-2">
          <Link
            href="/bfs"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">BFS</h2>
            <p className="text-sm text-muted-foreground">
              幅優先探索でグラフを層ごとに探索する
            </p>
          </Link>
          <Link
            href="/dfs"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">DFS</h2>
            <p className="text-sm text-muted-foreground">
              深さ優先探索でグラフを深く掘り下げて探索する
            </p>
          </Link>
          <Link
            href="/dijkstra"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Dijkstra法</h2>
            <p className="text-sm text-muted-foreground">
              非負重みグラフの単一始点最短路を求める
            </p>
          </Link>
          <Link
            href="/bellman-ford"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Bellman-Ford法</h2>
            <p className="text-sm text-muted-foreground">
              負辺を含むグラフの単一始点最短路を求める
            </p>
          </Link>
          <Link
            href="/warshall-floyd"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Warshall-Floyd法</h2>
            <p className="text-sm text-muted-foreground">
              全頂点対間の最短路を求める
            </p>
          </Link>
          <Link
            href="/spfa"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">SPFA</h2>
            <p className="text-sm text-muted-foreground">
              Bellman-Ford法のキュー最適化版
            </p>
          </Link>
          <Link
            href="/johnson"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Johnson&apos;s Algorithm</h2>
            <p className="text-sm text-muted-foreground">
              ポテンシャル変換で全頂点対間最短路を効率的に求める
            </p>
          </Link>
          <Link
            href="/a-star"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">A*探索</h2>
            <p className="text-sm text-muted-foreground">
              ヒューリスティックを用いた最短路探索
            </p>
          </Link>
          <Link
            href="/bidirectional-bfs"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">双方向BFS</h2>
            <p className="text-sm text-muted-foreground">
              始点と終点から同時にBFSして探索空間を削減する
            </p>
          </Link>
          <Link
            href="/01-bfs"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">0-1 BFS</h2>
            <p className="text-sm text-muted-foreground">
              辺の重みが0か1のグラフでの最短路をdequeで求める
            </p>
          </Link>
          <Link
            href="/dial"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Dial&apos;s Algorithm</h2>
            <p className="text-sm text-muted-foreground">
              バケット配列を使った最短路アルゴリズム
            </p>
          </Link>
        </div>

        {/* グラフ（マッチング・フロー） */}
        <h2 className="text-xl font-bold mt-8 mb-3">グラフ（マッチング・フロー）</h2>
        <div className="space-y-2">
          <Link
            href="/ford-fulkerson"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">最大フロー (Ford-Fulkerson)</h2>
            <p className="text-sm text-muted-foreground">
              増加パスを繰り返し見つけて最大フローを求める
            </p>
          </Link>
          <Link
            href="/dinic"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">最大フロー (Dinic)</h2>
            <p className="text-sm text-muted-foreground">
              レベルグラフとブロッキングフローで効率的に最大フローを求める
            </p>
          </Link>
          <Link
            href="/push-relabel"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">最大フロー (Push-Relabel)</h2>
            <p className="text-sm text-muted-foreground">
              プリフローとラベル関数で最大フローを求める
            </p>
          </Link>
          <Link
            href="/min-cost-flow"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">最小費用流 (Primal-Dual)</h2>
            <p className="text-sm text-muted-foreground">
              最小コストで所定量のフローを流す
            </p>
          </Link>
          <Link
            href="/hopcroft-karp"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">二部マッチング (Hopcroft-Karp)</h2>
            <p className="text-sm text-muted-foreground">
              二部グラフの最大マッチングを効率的に求める
            </p>
          </Link>
          <Link
            href="/hungarian"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">二部マッチング (Hungarian)</h2>
            <p className="text-sm text-muted-foreground">
              コスト最小の完全マッチングを求める
            </p>
          </Link>
          <Link
            href="/blossom"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">一般マッチング (Edmonds&apos; Blossom)</h2>
            <p className="text-sm text-muted-foreground">
              一般グラフの最大マッチングを花の縮約で求める
            </p>
          </Link>
          <Link
            href="/min-cut"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">最小カット</h2>
            <p className="text-sm text-muted-foreground">
              グラフを2つに分割する最小重みの辺集合を求める
            </p>
          </Link>
          <Link
            href="/gomory-hu"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Gomory-Hu Tree</h2>
            <p className="text-sm text-muted-foreground">
              全頂点対間の最小カットを木構造で表現する
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
