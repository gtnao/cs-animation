---
title: "Dinic法 解説"
---

## Dinic法とは

Dinic法 (Dinic's algorithm) は、フローネットワーク上で最大フローを $O(V^2 E)$ で求めるアルゴリズムである。1970年に Yefim Dinitz によって提案された。

Ford-Fulkerson法が1本ずつ増加パスを探すのに対し、Dinic法は**レベルグラフ** (level graph) を構築し、その上で**ブロッキングフロー** (blocking flow) を一度に流すことで効率化を図る。

## 前提知識

フローネットワーク、残余グラフ、増加パスについては Ford-Fulkerson法の解説を参照。

## レベルグラフ

### 定義

残余グラフ $G_f$ 上で BFS を行い、ソース $s$ からの最短距離を $\text{level}(v)$ とする。

**レベルグラフ** $L_f$ は、残余グラフの辺のうち $\text{level}(u) + 1 = \text{level}(v)$ を満たす辺 $(u,v)$ のみを残したグラフである。

レベルグラフ上のパスは全て $s$ から $t$ への最短パスとなる。

### ブロッキングフロー

レベルグラフ $L_f$ 上の**ブロッキングフロー**とは、$s$ から $t$ へのパスが存在しなくなるまでフローを流したものである。つまり、全ての $s$-$t$ パス上に少なくとも1つの飽和辺が存在する。

ブロッキングフローは最大フローとは異なることに注意。レベルグラフ上での最大フローではなく、全パスをブロックすれば十分である。

## アルゴリズム

### 手順

1. 残余グラフ上で BFS を行い、レベルグラフを構築
2. シンク $t$ に到達できなければ終了
3. レベルグラフ上で DFS によりブロッキングフローを求める
4. フローを更新し、1 に戻る

```python title="dinic.py"
def dinic(graph, source, sink):
    max_flow = 0

    while True:
        # Build level graph via BFS
        level = bfs_level(graph, source)
        if level[sink] == -1:
            break

        # Find blocking flow via DFS
        while True:
            path_flow = dfs_blocking(graph, source, sink, level, float('inf'))
            if path_flow == 0:
                break
            max_flow += path_flow

    return max_flow
```

### DFS によるブロッキングフロー

DFS でパスを探索し、行き止まりに達した辺は以後の探索から除外する (retreat)。この最適化により、各フェーズの DFS は $O(VE)$ で完了する。

```python title="dfs_blocking.py"
def dfs_blocking(graph, u, sink, level, pushed):
    if u == sink:
        return pushed
    while iter[u] < len(adj[u]):
        v = adj[u][iter[u]]
        if level[v] == level[u] + 1 and capacity(u, v) > 0:
            d = dfs_blocking(graph, v, sink, level,
                           min(pushed, capacity(u, v)))
            if d > 0:
                # Update flow
                flow[u][v] += d
                flow[v][u] -= d
                return d
        iter[u] += 1
    return 0
```

## 計算量の解析

### レベルの増加

**補題**: 各フェーズの後、$\text{level}(t)$ は厳密に増加する。

**証明**: ブロッキングフローにより、現在のレベルグラフ上の全 $s$-$t$ パスがブロックされる。次の BFS で構築されるレベルグラフでは、以前のレベルの辺だけでは $t$ に到達できない。新しい辺 (逆辺) は同レベルか上位レベルにしか追加されないため、$\text{level}(t)$ は増加する。 $\square$

### フェーズ数

$\text{level}(t) \leq V - 1$ なので、フェーズ数は高々 $V - 1$ 回。

### 各フェーズの計算量

- BFS: $O(E)$
- ブロッキングフロー (DFS + retreat): $O(VE)$

### 全体の計算量

$$
O(V \cdot VE) = O(V^2 E)
$$

### 単位容量グラフでの改善

全辺の容量が 1 の場合、各フェーズのブロッキングフローは $O(E)$ で求められ、フェーズ数は $O(\sqrt{E})$ 回に制限される。したがって全体で $O(E\sqrt{E})$ となる。

この性質は二部マッチングへの応用 (Hopcroft-Karp法) で重要になる。

## Ford-Fulkerson法との比較

| 項目 | Ford-Fulkerson (BFS) | Dinic |
|------|---------------------|-------|
| 計算量 | $O(VE^2)$ | $O(V^2 E)$ |
| 1反復 | 1本の増加パス | ブロッキングフロー全体 |
| パス選択 | 最短パス | レベルグラフ上の全パス |
| 単位容量 | $O(E \cdot \min(E^{1/2}, V^{2/3}))$ | $O(E\sqrt{V})$ |

## 実装上の工夫

### イテレータの保持

DFS で行き止まりに達した辺を再探索しないよう、各頂点で次に見るべき辺のインデックス (`iter[v]`) を保持する。これにより retreat のコストが償却される。

### 隣接リストの構造

逆辺へのアクセスを $O(1)$ で行うため、辺 $i$ の逆辺を $i \oplus 1$ (XOR) の位置に格納する実装が一般的である。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | フローネットワーク $G = (V, E)$、ソース $s$、シンク $t$ |
| 出力 | 最大フロー値 |
| 時間計算量 | $O(V^2 E)$ |
| 空間計算量 | $O(V + E)$ |
| 核心 | レベルグラフ上のブロッキングフロー |
| 応用 | 二部マッチング、ネットワーク設計、スケジューリング |
