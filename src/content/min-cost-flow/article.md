---
title: "最小費用流 (Primal-Dual) 解説"
---

## 最小費用流問題とは

最小費用流問題 (Minimum Cost Flow Problem) は、フローネットワーク上で所定量のフローを**最小の総費用**で流す問題である。最大フロー問題の一般化であり、最短路問題やマッチング問題も特殊ケースとして含む。

## 問題の定義

### 入力

- 有向グラフ $G = (V, E)$
- 容量関数 $c: E \to \mathbb{R}_{\geq 0}$
- **コスト関数** $w: E \to \mathbb{R}$: 辺 $(u,v)$ に 1 単位のフローを流すコスト
- ソース $s$、シンク $t$
- 要求フロー量 $F$

### 目的

フロー値が $F$ であるフロー $f$ の中で、総費用:

$$
\text{cost}(f) = \sum_{(u,v) \in E} f(u,v) \cdot w(u,v)
$$

を最小化するものを求める。

## Primal-Dual法 (最短路反復法)

### 核心アイデア

最小費用流の Primal-Dual法は、**残余グラフ上の最短路に沿ってフローを流す**操作を繰り返す。各反復で最小コストの増加パスを選ぶことで、最適性が保証される。

### 残余グラフのコスト

フロー $f$ に対する残余グラフの辺のコスト:

- 順辺 $(u,v)$: コスト $w(u,v)$
- 逆辺 $(v,u)$: コスト $-w(u,v)$

逆辺のコストが負になるため、最短路の計算に注意が必要である。

### アルゴリズム

```python title="min_cost_flow.py"
def min_cost_flow(graph, source, sink, target_flow):
    total_flow = 0
    total_cost = 0

    while total_flow < target_flow:
        # Find shortest path in residual graph
        dist, parent = bellman_ford(residual_graph, source)

        if dist[sink] == INF:
            break  # No more augmenting path

        # Determine bottleneck
        bottleneck = target_flow - total_flow
        v = sink
        while v != source:
            edge = parent[v]
            bottleneck = min(bottleneck, residual_capacity(edge))
            v = edge.from

        # Augment flow
        v = sink
        while v != source:
            edge = parent[v]
            augment(edge, bottleneck)
            v = edge.from

        total_flow += bottleneck
        total_cost += bottleneck * dist[sink]

    return total_flow, total_cost
```

## 正当性の証明

### 最適部分構造

**定理**: $f$ が流量 $k$ の最小費用流であるとき、残余グラフ $G_f$ 上の最短路に沿って 1 単位のフローを追加した $f'$ は、流量 $k+1$ の最小費用流である。

**証明の概略**: 背理法。$f'$ より低コストの流量 $k+1$ のフロー $g$ が存在すると仮定する。$g$ と $f$ の差分フロー $g - f$ は残余グラフ上のフロー分解で表現でき、そのコストは $\text{cost}(g) - \text{cost}(f)$ に等しい。この差分フローのコストが最短路のコストより小さいことになるが、最短路は残余グラフ上での最小コストパスなので矛盾。 $\square$

### 負のサイクルの不在

最小費用流の重要な性質として、最小費用フロー $f$ の残余グラフには**負コストのサイクルが存在しない**ことが知られている。逆に、負コストのサイクルがないフローは最小費用である (最適性条件)。

## ポテンシャルによる高速化

### 負辺の問題

残余グラフには逆辺 (負コスト) が存在するため、Dijkstra法をそのまま使えない。Bellman-Ford法を使うと各反復 $O(VE)$ かかる。

### Johnson の手法

**ポテンシャル** $h: V \to \mathbb{R}$ を導入し、辺のコストを以下のように変換する:

$$
w'(u,v) = w(u,v) + h(u) - h(v)
$$

$h(v)$ をソースからの最短距離とすると、$w'(u,v) \geq 0$ が保証される。これにより Dijkstra法が使用可能になる。

各反復後、ポテンシャルを更新:

$$
h'(v) = h(v) + d(v)
$$

ここで $d(v)$ は変換後のコストでの最短距離。

### Dijkstra + ポテンシャルの計算量

1回の最短路探索: $O(E \log V)$ (二分ヒープ) または $O(V^2)$ (配列)

## 計算量

| 最短路アルゴリズム | 1反復の計算量 | 全体の計算量 |
|------------------|-------------|------------|
| Bellman-Ford | $O(VE)$ | $O(FVE)$ |
| Dijkstra + ポテンシャル | $O(E \log V)$ | $O(FE \log V)$ |

ここで $F$ は最大フロー値。容量が整数なら反復回数は高々 $F$ 回。

## 応用

### 割当問題

$n$ 個のタスクを $n$ 人のワーカーに割り当てる問題。ワーカー $i$ がタスク $j$ を行うコストが $c_{ij}$ のとき、総コスト最小の割当を求める。

二部グラフ上の最小費用完全マッチングとして定式化でき、最小費用流で解ける。

### 輸送問題

複数の供給地と需要地の間で物資を輸送するコスト最小化問題。

### 最小重みマッチング

二部グラフの最小重みマッチングは最小費用流の特殊ケース。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | コスト付きフローネットワーク、要求フロー量 $F$ |
| 出力 | 最小費用フロー |
| 時間計算量 | $O(FVE)$ (Bellman-Ford)、$O(FE \log V)$ (Dijkstra + ポテンシャル) |
| 空間計算量 | $O(V + E)$ |
| 核心 | 残余グラフ上の最短路に沿ったフロー増加 |
| 応用 | 割当問題、輸送問題、スケジューリング |
