---
title: "Gomory-Hu Tree 解説"
---

## Gomory-Hu Tree とは

**Gomory-Hu Tree** (Gomory-Hu 木, カット木) は、無向重み付きグラフの**全頂点対の最小カット情報**を1本の木に凝縮したデータ構造である。1961年に R.E. Gomory と T.C. Hu によって提案された。

$n$ 頂点のグラフでは $\binom{n}{2}$ 対の最小カットが存在するが、Gomory-Hu木では $n - 1$ 回の最大フロー計算だけでこれら全ての情報を求められる。

## 定義

### Gomory-Hu 木の性質

無向グラフ $G = (V, E, c)$ (容量 $c$) に対する Gomory-Hu 木 $T = (V, E_T, w)$ は以下を満たす:

1. $T$ は $V$ 上の木 (辺数 $|V| - 1$)
2. 任意の頂点対 $s, t \in V$ について、$T$ 上の $s$-$t$ パスの**最小重み辺**の重みが $G$ における $s$-$t$ 最小カット容量に等しい
3. $T$ 上の最小重み辺を除去して得られる2つの連結成分が、$G$ における $s$-$t$ 最小カットの $(S, T)$ に対応する

### 直感的な理解

Gomory-Hu 木は「最小カットの木」と考えられる。木の各辺は元のグラフの最小カットに対応し、その重みがカット容量。任意の2頂点間の最小カットは、木のパス上で最も弱い辺 (ボトルネック) を見ることで $O(V)$ で求められる。

## 構築アルゴリズム

### 概要

Gomory-Hu のアルゴリズムは以下の手順で木を構築する:

1. 全頂点を1つのグループにまとめた初期状態から始める
2. 各反復で、あるグループから2頂点 $s, t$ を選び、$G$ 上で $s$-$t$ 最大フローを計算
3. 最小カットによりグループを分割し、木辺を追加
4. $n - 1$ 回繰り返して完成

### 詳細な手順

```python title="gomory_hu.py"
def gomory_hu_tree(graph):
    n = len(graph.nodes)
    # Initial tree: all nodes connected to node 0
    parent = [0] * n  # parent[i] = 0 for all i != 0
    weight = [0] * n

    for i in range(1, n):
        # Compute max-flow between i and parent[i]
        s, t = i, parent[i]
        max_flow_value, S = max_flow_with_cut(graph, s, t)
        weight[i] = max_flow_value

        # Update tree structure
        for j in range(i + 1, n):
            if parent[j] == t and j in S:
                parent[j] = i

    # Build tree from parent[] and weight[]
    tree_edges = [(i, parent[i], weight[i]) for i in range(1, n)]
    return tree_edges
```

### 各反復の詳細

反復 $i$ ($i = 1, 2, \ldots, n-1$):

1. 頂点 $i$ とその現在の親 $p = \text{parent}[i]$ を選ぶ
2. $G$ 上で $i$-$p$ 最大フローを計算し、最小カット $(S, \bar{S})$ を求める ($i \in S$)
3. 木辺 $(i, p)$ の重みを最大フロー値に設定
4. $j > i$ で $\text{parent}[j] = p$ かつ $j \in S$ となる頂点 $j$ の親を $i$ に変更

## 正当性の証明

### 定理: 構築された木は Gomory-Hu 木の性質を満たす

**証明の概略**:

帰納法による。$k$ 回の反復後、頂点 $\{0, 1, \ldots, k\}$ に関する部分問題のGomory-Hu木が正しく構築されていることを示す。

鍵となるのは以下の性質:

1. **最小カットの入れ子性**: 2つの最小カット $(S_1, \bar{S_1})$ と $(S_2, \bar{S_2})$ について、$S_1 \cap S_2$, $S_1 \cap \bar{S_2}$, $\bar{S_1} \cap S_2$, $\bar{S_1} \cap \bar{S_2}$ のうち少なくとも1つが空でなければ、劣モジュラ性から新たな最小カットが構成できる。

2. **親の更新の正当性**: 頂点 $j$ の親を $p$ から $i$ に変更しても、$j$-$p$ 最小カット情報は保存される。これは $j$ が $S$ (=$i$ 側) に含まれることから、$j$-$p$ 最小カットが $i$-$p$ 最小カットを「跨ぐ」ことがないためである。 $\square$

## 計算量

### 構築

- 最大フロー計算: $n - 1$ 回
- 各最大フロー: $O(V^2 E)$ (Dinic) や $O(VE^2)$ (Edmonds-Karp)
- **全体: $O(V \cdot \text{MaxFlow}(V, E))$**

Dinic法を使う場合: $O(V^3 E)$

### クエリ

木が構築された後、任意の2頂点間の最小カットクエリは:

- 木上のパスの最小重み辺を求める: $O(V)$ (素朴)
- LCA + Sparse Table 等の前処理で: $O(\log V)$ per query

## 応用

### ネットワーク信頼性

ネットワーク全体の脆弱性解析。全頂点対の最小カットを効率的に求められるため、最も脆弱な接続を特定できる。

### クラスタリング

Gomory-Hu 木を用いてグラフを $k$ 個のクラスタに分割する。木の最小重み辺を $k - 1$ 本除去すれば、最小カットに基づくクラスタリングが得られる。

### 全域最小カット

Gomory-Hu 木の最小重み辺が、グラフ全体の最小カットに対応する。

### マルチコモディティフロー

複数のソース・シンク対がある場合のフロー問題の下界計算に利用。

## Gusfield のアルゴリズム

1990年に Dan Gusfield が提案した簡略版。Gomory-Hu のアルゴリズムでは最小カットの構造を利用して親を更新するが、Gusfield版では単純に $n - 1$ 回の最大フロー計算のみで同等の木を構築する。実装がより簡単。

```python title="gusfield.py"
def gusfield(graph):
    n = len(graph.nodes)
    parent = [0] * n
    weight = [0] * n

    for i in range(1, n):
        weight[i] = max_flow(graph, i, parent[i])
        for j in range(i + 1, n):
            if parent[j] == parent[i]:
                if max_flow(graph, j, i) <= max_flow(graph, j, parent[i]):
                    parent[j] = i

    return [(i, parent[i], weight[i]) for i in range(1, n)]
```

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 無向重み付きグラフ $G = (V, E, c)$ |
| 出力 | Gomory-Hu 木 (全頂点対の最小カット情報を含む木) |
| 構築の計算量 | $O(V \cdot \text{MaxFlow}(V, E))$ |
| クエリの計算量 | $O(V)$ (素朴)、$O(\log V)$ (前処理あり) |
| 核心 | $n - 1$ 回の最大フロー計算で $\binom{n}{2}$ 対の情報を取得 |
| 応用 | ネットワーク信頼性、クラスタリング、全域最小カット |
