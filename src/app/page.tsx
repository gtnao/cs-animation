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

        {/* グラフ（その他） */}
        <h2 className="text-xl font-bold mt-8 mb-3">グラフ（その他）</h2>
        <div className="space-y-2">
          <Link
            href="/bipartite-check"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">二部グラフ判定</h2>
            <p className="text-sm text-muted-foreground">
              BFSで2色塗り分けにより二部グラフを判定する
            </p>
          </Link>
          <Link
            href="/cycle-detection"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">サイクル検出</h2>
            <p className="text-sm text-muted-foreground">
              DFSでグラフ中の閉路を検出する
            </p>
          </Link>
          <Link
            href="/graph-coloring"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">グラフ彩色</h2>
            <p className="text-sm text-muted-foreground">
              隣接頂点が異なる色になるよう頂点を彩色する
            </p>
          </Link>
          <Link
            href="/two-sat"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">2-SAT</h2>
            <p className="text-sm text-muted-foreground">
              含意グラフとSCCで2-SAT問題を解く
            </p>
          </Link>
          <Link
            href="/tree-diameter"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">木の直径</h2>
            <p className="text-sm text-muted-foreground">
              2回のBFSで木の最遠頂点対間距離を求める
            </p>
          </Link>
          <Link
            href="/tree-centroid"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">木の重心</h2>
            <p className="text-sm text-muted-foreground">
              部分木サイズの最大値を最小化する頂点を求める
            </p>
          </Link>
          <Link
            href="/centroid-decomposition"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">重心分解</h2>
            <p className="text-sm text-muted-foreground">
              木を重心で再帰的に分割して分解木を構築する
            </p>
          </Link>
          <Link
            href="/auxiliary-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Auxiliary Tree (Virtual Tree)</h2>
            <p className="text-sm text-muted-foreground">
              指定頂点集合のLCAを含む圧縮木を構築する
            </p>
          </Link>
          <Link
            href="/block-cut-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Block Cut Tree</h2>
            <p className="text-sm text-muted-foreground">
              二重連結成分と関節点の木構造を構築する
            </p>
          </Link>
          <Link
            href="/tree-isomorphism"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">木の同型判定</h2>
            <p className="text-sm text-muted-foreground">
              正規形で2つの木が同型かを判定する
            </p>
          </Link>
          <Link
            href="/prufer-sequence"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Prüfer Sequence</h2>
            <p className="text-sm text-muted-foreground">
              ラベル付き木とPrüfer列の全単射
            </p>
          </Link>
        </div>

        {/* データ構造（基本） */}
        <h2 className="text-xl font-bold mt-8 mb-3">データ構造（基本）</h2>
        <div className="space-y-2">
          <Link
            href="/stack"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Stack</h2>
            <p className="text-sm text-muted-foreground">
              LIFO構造でデータを管理する
            </p>
          </Link>
          <Link
            href="/queue"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Queue</h2>
            <p className="text-sm text-muted-foreground">
              FIFO構造でデータを管理する
            </p>
          </Link>
          <Link
            href="/deque"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Deque</h2>
            <p className="text-sm text-muted-foreground">
              両端からの挿入・削除が可能なキュー
            </p>
          </Link>
          <Link
            href="/binary-heap"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Priority Queue (Binary Heap)</h2>
            <p className="text-sm text-muted-foreground">
              二分ヒープによる優先度付きキュー
            </p>
          </Link>
          <Link
            href="/linked-list"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Linked List</h2>
            <p className="text-sm text-muted-foreground">
              ポインタで要素を連結するリスト構造
            </p>
          </Link>
          <Link
            href="/hash-table"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Hash Table</h2>
            <p className="text-sm text-muted-foreground">
              ハッシュ関数で高速な検索・挿入・削除を実現する
            </p>
          </Link>
          <Link
            href="/union-find"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Union-Find</h2>
            <p className="text-sm text-muted-foreground">
              素集合の統合と所属判定を効率的に行う
            </p>
          </Link>
          <Link
            href="/weighted-union-find"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">重み付き Union-Find</h2>
            <p className="text-sm text-muted-foreground">
              要素間の相対的な重みを管理するUnion-Find
            </p>
          </Link>
        </div>

        {/* データ構造（区間・列） */}
        <h2 className="text-xl font-bold mt-8 mb-3">データ構造（区間・列）</h2>
        <div className="space-y-2">
          <Link
            href="/segment-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">セグメント木</h2>
            <p className="text-sm text-muted-foreground">
              区間クエリと点更新を O(log n) で行う木構造
            </p>
          </Link>
          <Link
            href="/lazy-segment-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">遅延評価セグメント木</h2>
            <p className="text-sm text-muted-foreground">
              区間更新と区間クエリを O(log n) で行う
            </p>
          </Link>
          <Link
            href="/persistent-segment-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">永続セグメント木</h2>
            <p className="text-sm text-muted-foreground">
              過去のバージョンを保持するセグメント木
            </p>
          </Link>
          <Link
            href="/dynamic-segment-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">動的セグメント木</h2>
            <p className="text-sm text-muted-foreground">
              必要なノードのみ動的に生成するセグメント木
            </p>
          </Link>
          <Link
            href="/merge-sort-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Merge Sort Tree</h2>
            <p className="text-sm text-muted-foreground">
              各ノードにソート済み配列を持つセグメント木
            </p>
          </Link>
          <Link
            href="/fenwick-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">BIT (Fenwick Tree)</h2>
            <p className="text-sm text-muted-foreground">
              累積和の点更新と区間クエリを効率的に行う
            </p>
          </Link>
          <Link
            href="/fenwick-tree-2d"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">2次元BIT</h2>
            <p className="text-sm text-muted-foreground">
              2次元の累積和クエリを効率的に行う
            </p>
          </Link>
          <Link
            href="/sqrt-decomposition"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">平方分割</h2>
            <p className="text-sm text-muted-foreground">
              配列を √n 個のブロックに分割してクエリを処理する
            </p>
          </Link>
          <Link
            href="/mos-algorithm"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Mo&apos;s Algorithm</h2>
            <p className="text-sm text-muted-foreground">
              オフラインクエリを平方分割で効率的に処理する
            </p>
          </Link>
          <Link
            href="/sparse-table"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Sparse Table</h2>
            <p className="text-sm text-muted-foreground">
              静的な区間最小値クエリを O(1) で応答する
            </p>
          </Link>
          <Link
            href="/disjoint-sparse-table"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Disjoint Sparse Table</h2>
            <p className="text-sm text-muted-foreground">
              冪等でない演算にも対応する O(1) 区間クエリ
            </p>
          </Link>
          <Link
            href="/wavelet-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Wavelet Tree</h2>
            <p className="text-sm text-muted-foreground">
              区間k番目や区間頻度を効率的に求める木構造
            </p>
          </Link>
        </div>

        {/* データ構造（平衡二分探索木） */}
        <h2 className="text-xl font-bold mt-8 mb-3">データ構造（平衡二分探索木）</h2>
        <div className="space-y-2">
          <Link
            href="/bst"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">二分探索木 (BST)</h2>
            <p className="text-sm text-muted-foreground">
              順序を保つ基本的な木構造
            </p>
          </Link>
          <Link
            href="/avl-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">AVL木</h2>
            <p className="text-sm text-muted-foreground">
              高さバランスを保つ平衡二分探索木
            </p>
          </Link>
          <Link
            href="/red-black-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">赤黒木</h2>
            <p className="text-sm text-muted-foreground">
              色による制約で平衡を保つ二分探索木
            </p>
          </Link>
          <Link
            href="/splay-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Splay木</h2>
            <p className="text-sm text-muted-foreground">
              アクセスしたノードを根に持ち上げる自己調整木
            </p>
          </Link>
          <Link
            href="/treap"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Treap</h2>
            <p className="text-sm text-muted-foreground">
              BST と Heap の性質を組み合わせたランダム化木
            </p>
          </Link>
          <Link
            href="/scapegoat-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Scapegoat木</h2>
            <p className="text-sm text-muted-foreground">
              不均衡な部分木を再構築して平衡を維持する
            </p>
          </Link>
          <Link
            href="/b-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">B木</h2>
            <p className="text-sm text-muted-foreground">
              多分岐の平衡探索木でディスクアクセスを最適化
            </p>
          </Link>
          <Link
            href="/b-plus-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">B+木</h2>
            <p className="text-sm text-muted-foreground">
              葉にデータを集約しリーフ間をリンクしたB木の改良版
            </p>
          </Link>
          <Link
            href="/skip-list"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Skip List</h2>
            <p className="text-sm text-muted-foreground">
              多段リンクリストで確率的に平衡を実現する
            </p>
          </Link>
        </div>

        {/* データ構造（木クエリ） */}
        <h2 className="text-xl font-bold mt-8 mb-3">データ構造（木クエリ）</h2>
        <div className="space-y-2">
          <Link
            href="/lca-doubling"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">最小共通祖先 (LCA) - ダブリング</h2>
            <p className="text-sm text-muted-foreground">
              ダブリングで木上の最小共通祖先を求める
            </p>
          </Link>
          <Link
            href="/lca-euler-tour"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">最小共通祖先 (LCA) - Euler Tour</h2>
            <p className="text-sm text-muted-foreground">
              Euler Tour + Sparse Table で LCA を O(1) で求める
            </p>
          </Link>
          <Link
            href="/hld"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Heavy-Light Decomposition</h2>
            <p className="text-sm text-muted-foreground">
              木をヘビーチェーンに分解してパスクエリを効率化する
            </p>
          </Link>
          <Link
            href="/euler-tour"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Euler Tour</h2>
            <p className="text-sm text-muted-foreground">
              DFS で木を一次元列に変換する
            </p>
          </Link>
          <Link
            href="/link-cut-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Link-Cut Tree</h2>
            <p className="text-sm text-muted-foreground">
              動的な木構造でパスクエリ・link・cut を効率的に行う
            </p>
          </Link>
          <Link
            href="/tree-path-query"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">木上のパスクエリ</h2>
            <p className="text-sm text-muted-foreground">
              木上のパスに対する集約クエリの各種手法
            </p>
          </Link>
        </div>

        {/* データ構造（発展） */}
        <h2 className="text-xl font-bold mt-8 mb-3">データ構造（発展）</h2>
        <div className="space-y-2">
          <Link
            href="/fibonacci-heap"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Fibonacci Heap</h2>
            <p className="text-sm text-muted-foreground">
              償却 O(1) の insert と decrease-key を持つヒープ
            </p>
          </Link>
          <Link
            href="/leftist-heap"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Leftist Heap</h2>
            <p className="text-sm text-muted-foreground">
              s値で左偏性を保つマージ可能ヒープ
            </p>
          </Link>
          <Link
            href="/pairing-heap"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Pairing Heap</h2>
            <p className="text-sm text-muted-foreground">
              シンプルで高速なマージ可能ヒープ
            </p>
          </Link>
          <Link
            href="/skew-heap"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Skew Heap</h2>
            <p className="text-sm text-muted-foreground">
              無条件左右交換のマージ可能ヒープ
            </p>
          </Link>
          <Link
            href="/interval-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Interval Tree</h2>
            <p className="text-sm text-muted-foreground">
              区間の重なりを効率的に検索する木構造
            </p>
          </Link>
          <Link
            href="/kd-tree"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">k-d Tree</h2>
            <p className="text-sm text-muted-foreground">
              多次元空間の点を管理する木構造
            </p>
          </Link>
          <Link
            href="/bloom-filter"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Bloom Filter</h2>
            <p className="text-sm text-muted-foreground">
              確率的メンバーシップテスト
            </p>
          </Link>
          <Link
            href="/count-min-sketch"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Count-Min Sketch</h2>
            <p className="text-sm text-muted-foreground">
              頻度を近似的に推定するスケッチデータ構造
            </p>
          </Link>
          <Link
            href="/persistent-array"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Persistent Array</h2>
            <p className="text-sm text-muted-foreground">
              過去のバージョンを保持する永続配列
            </p>
          </Link>
          <Link
            href="/rope"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Rope</h2>
            <p className="text-sm text-muted-foreground">
              文字列の効率的な編集操作を実現する平衡二分木
            </p>
          </Link>
        </div>

        {/* 数学（整数論） */}
        <h2 className="text-xl font-bold mt-8 mb-3">数学（整数論）</h2>
        <div className="space-y-2">
          <Link href="/gcd" className="block p-4 border border-border rounded hover:bg-accent transition-colors">
            <h2 className="font-semibold">ユークリッドの互除法</h2>
            <p className="text-sm text-muted-foreground">2つの整数の最大公約数を求める</p>
          </Link>
          <Link href="/ext-gcd" className="block p-4 border border-border rounded hover:bg-accent transition-colors">
            <h2 className="font-semibold">拡張ユークリッドの互除法</h2>
            <p className="text-sm text-muted-foreground">ax + by = gcd(a,b) の整数解を求める</p>
          </Link>
          <Link href="/crt" className="block p-4 border border-border rounded hover:bg-accent transition-colors">
            <h2 className="font-semibold">中国剰余定理 (CRT)</h2>
            <p className="text-sm text-muted-foreground">連立合同式の解を求める</p>
          </Link>
          <Link href="/sieve-of-eratosthenes" className="block p-4 border border-border rounded hover:bg-accent transition-colors">
            <h2 className="font-semibold">エラトステネスの篩</h2>
            <p className="text-sm text-muted-foreground">N以下の素数を列挙する</p>
          </Link>
          <Link href="/linear-sieve" className="block p-4 border border-border rounded hover:bg-accent transition-colors">
            <h2 className="font-semibold">線形篩</h2>
            <p className="text-sm text-muted-foreground">O(N)で素数と最小素因数を列挙する</p>
          </Link>
          <Link href="/mobius" className="block p-4 border border-border rounded hover:bg-accent transition-colors">
            <h2 className="font-semibold">メビウス関数・反転公式</h2>
            <p className="text-sm text-muted-foreground">約数の包除に基づく反転公式</p>
          </Link>
          <Link href="/euler-totient" className="block p-4 border border-border rounded hover:bg-accent transition-colors">
            <h2 className="font-semibold">オイラーのφ関数</h2>
            <p className="text-sm text-muted-foreground">nと互いに素な正整数の個数を求める</p>
          </Link>
          <Link href="/fast-pow" className="block p-4 border border-border rounded hover:bg-accent transition-colors">
            <h2 className="font-semibold">高速べき乗 (繰り返し二乗法)</h2>
            <p className="text-sm text-muted-foreground">O(log n)でべき乗を計算する</p>
          </Link>
          <Link href="/bsgs" className="block p-4 border border-border rounded hover:bg-accent transition-colors">
            <h2 className="font-semibold">離散対数 (Baby-step Giant-step)</h2>
            <p className="text-sm text-muted-foreground">離散対数問題をO(√p)で解く</p>
          </Link>
          <Link href="/miller-rabin" className="block p-4 border border-border rounded hover:bg-accent transition-colors">
            <h2 className="font-semibold">Miller-Rabin素数判定</h2>
            <p className="text-sm text-muted-foreground">確率的な高速素数判定法</p>
          </Link>
          <Link href="/pollard-rho" className="block p-4 border border-border rounded hover:bg-accent transition-colors">
            <h2 className="font-semibold">Pollard&apos;s rho法</h2>
            <p className="text-sm text-muted-foreground">乱択アルゴリズムによる素因数分解</p>
          </Link>
          <Link href="/primitive-root" className="block p-4 border border-border rounded hover:bg-accent transition-colors">
            <h2 className="font-semibold">原始根</h2>
            <p className="text-sm text-muted-foreground">mod pの乗法群の生成元を求める</p>
          </Link>
          <Link href="/floor-sum" className="block p-4 border border-border rounded hover:bg-accent transition-colors">
            <h2 className="font-semibold">フロアサム (Floor Sum)</h2>
            <p className="text-sm text-muted-foreground">Σfloor((a*i+b)/m)を高速に計算する</p>
          </Link>
          <Link href="/stern-brocot" className="block p-4 border border-border rounded hover:bg-accent transition-colors">
            <h2 className="font-semibold">Stern-Brocot Tree</h2>
            <p className="text-sm text-muted-foreground">正有理数を二分探索木で体系的に列挙する</p>
          </Link>
        </div>

        {/* 数学（線形代数） */}
        <h2 className="text-xl font-bold mt-8 mb-3">数学（線形代数）</h2>
        <div className="space-y-2">
          <Link
            href="/matrix-multiplication"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">行列積</h2>
            <p className="text-sm text-muted-foreground">
              2つの行列の積を計算する
            </p>
          </Link>
          <Link
            href="/matrix-exponentiation"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">行列累乗</h2>
            <p className="text-sm text-muted-foreground">
              繰り返し二乗法で行列のべき乗を高速に計算する
            </p>
          </Link>
          <Link
            href="/gaussian-elimination"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">ガウスの消去法</h2>
            <p className="text-sm text-muted-foreground">
              行基本変形で連立一次方程式を解く
            </p>
          </Link>
          <Link
            href="/gaussian-elimination-mod2"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">ガウスの消去法 (mod 2)</h2>
            <p className="text-sm text-muted-foreground">
              GF(2)上のビット行列でXOR消去を行う
            </p>
          </Link>
          <Link
            href="/determinant"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">行列式</h2>
            <p className="text-sm text-muted-foreground">
              ガウスの消去法で行列式を計算する
            </p>
          </Link>
          <Link
            href="/linear-basis"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">線形基底 (XOR Basis)</h2>
            <p className="text-sm text-muted-foreground">
              XOR空間の基底を構築する
            </p>
          </Link>
        </div>

        {/* 探索 */}
        <h2 className="text-xl font-bold mt-8 mb-3">探索</h2>
        <div className="space-y-2">
          <Link
            href="/binary-search"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">二分探索</h2>
            <p className="text-sm text-muted-foreground">
              ソート済み配列で探索範囲を半分ずつ絞る
            </p>
          </Link>
          <Link
            href="/ternary-search"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">三分探索</h2>
            <p className="text-sm text-muted-foreground">
              凸関数の極値を区間の三等分で求める
            </p>
          </Link>
          <Link
            href="/golden-section-search"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">黄金分割探索</h2>
            <p className="text-sm text-muted-foreground">
              黄金比で区間を縮小して凸関数の極値を求める
            </p>
          </Link>
          <Link
            href="/meet-in-the-middle"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">半分全列挙</h2>
            <p className="text-sm text-muted-foreground">
              集合を半分に分割して全列挙の計算量を削減する
            </p>
          </Link>
          <Link
            href="/pruning-search"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">枝刈り全探索</h2>
            <p className="text-sm text-muted-foreground">
              見込みのない分岐を刈って探索空間を削減する
            </p>
          </Link>
          <Link
            href="/ida-star"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">IDA*</h2>
            <p className="text-sm text-muted-foreground">
              反復深化とA*のヒューリスティックを組み合わせた探索
            </p>
          </Link>
          <Link
            href="/beam-search"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">ビームサーチ</h2>
            <p className="text-sm text-muted-foreground">
              ビーム幅で候補を制限する幅優先的探索
            </p>
          </Link>
          <Link
            href="/simulated-annealing"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">焼きなまし法</h2>
            <p className="text-sm text-muted-foreground">
              温度パラメータで確率的に悪化を許容する最適化手法
            </p>
          </Link>
          <Link
            href="/genetic-algorithm"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">遺伝的アルゴリズム</h2>
            <p className="text-sm text-muted-foreground">
              選択・交叉・突然変異で進化的に解を探索する
            </p>
          </Link>
        </div>

        {/* 動的計画法 */}
        <h2 className="text-xl font-bold mt-8 mb-3">動的計画法</h2>
        <div className="space-y-2">
          <Link
            href="/digit-dp"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">桁DP</h2>
            <p className="text-sm text-muted-foreground">
              数の各桁を状態として条件を満たす数を数え上げる
            </p>
          </Link>
          <Link
            href="/bitmask-dp"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">ビットDP</h2>
            <p className="text-sm text-muted-foreground">
              集合をビットマスクで表現し部分集合を状態とするDP
            </p>
          </Link>
          <Link
            href="/interval-dp"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">区間DP</h2>
            <p className="text-sm text-muted-foreground">
              区間を分割・統合して最適解を求めるDP
            </p>
          </Link>
          <Link
            href="/tree-dp"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">木DP</h2>
            <p className="text-sm text-muted-foreground">
              木構造上で葉から根に向かって集約するDP
            </p>
          </Link>
          <Link
            href="/sos-dp"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">SOS DP (Sum over Subsets)</h2>
            <p className="text-sm text-muted-foreground">
              全部分集合の和を高速に計算するDP
            </p>
          </Link>
          <Link
            href="/convex-hull-trick"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Convex Hull Trick</h2>
            <p className="text-sm text-muted-foreground">
              一次関数群の最小値クエリでDP遷移を高速化する
            </p>
          </Link>
          <Link
            href="/knuth-optimization"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Knuth's Optimization</h2>
            <p className="text-sm text-muted-foreground">
              Monge性を利用して区間DPの遷移を高速化する
            </p>
          </Link>
          <Link
            href="/alien-dp"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Alien DP (Lagrangian Relaxation)</h2>
            <p className="text-sm text-muted-foreground">
              ラグランジュ緩和で個数制約付きDPを高速に解く
            </p>
          </Link>
          <Link
            href="/monge-smawk"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Monge性とSMAWK</h2>
            <p className="text-sm text-muted-foreground">
              Monge行列の行最小値を線形時間で求める
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
