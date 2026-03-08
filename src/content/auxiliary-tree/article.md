---
title: "Auxiliary Tree 解説"
---

## Auxiliary Tree とは

**Auxiliary Tree** (仮想木、Virtual Tree とも呼ばれる) は、根付き木 $T$ の頂点の部分集合 $S$ に対して、$S$ に含まれる頂点とそれらの LCA だけを含む圧縮木である。

元の木が $n$ 頂点であっても、$|S| = k$ のとき Auxiliary Tree は高々 $2k - 1$ 頂点しか持たない。これにより、$S$ に関するクエリを $O(k)$ や $O(k \log n)$ で処理できる。

### 定義

根付き木 $T$ と頂点集合 $S \subseteq V(T)$ に対して、Auxiliary Tree $T'$ は以下の頂点集合を持つ:

$$
V(T') = S \cup \{\ \text{LCA}(u, v) \mid u, v \in S,\ u \text{ と } v \text{ はDFS順で隣接}\ \}
$$

$T'$ の辺は、$V(T')$ の頂点間で元の木における祖先-子孫関係がある (かつ間に $V(T')$ の他の頂点がない) ペアを結ぶ。

### 頂点数の上界

$|S| = k$ のとき、隣接ペアの LCA は高々 $k - 1$ 個である。したがって:

$$
|V(T')| \leq k + (k - 1) = 2k - 1
$$

## 構築アルゴリズム

### 手順

1. $S$ の頂点を DFS 行きがけ順にソートする: $v_1, v_2, \ldots, v_k$
2. 隣接する頂点ペアの LCA を全て計算する: $\text{LCA}(v_1, v_2), \text{LCA}(v_2, v_3), \ldots$
3. LCA を $S$ に追加し、全体を DFS 順にソートする
4. スタックを使って辺を構築する

### 実装

```python title="auxiliary_tree.py"
def build_auxiliary_tree(
    selected: list[int],
    dfs_order: dict[int, int],  # vertex -> DFS timestamp
    lca_func,  # (u, v) -> LCA
    depth: list[int]
) -> tuple[list[int], list[tuple[int, int]]]:
    """Build auxiliary tree from selected vertices."""
    if not selected:
        return [], []

    # Sort by DFS order
    verts = sorted(selected, key=lambda v: dfs_order[v])

    # Add LCAs of adjacent pairs
    extra = set()
    for i in range(len(verts) - 1):
        extra.add(lca_func(verts[i], verts[i + 1]))

    all_verts = sorted(set(verts) | extra, key=lambda v: dfs_order[v])

    # Build edges using stack
    edges = []
    stack = []
    for v in all_verts:
        if not stack:
            stack.append(v)
            continue
        lca = lca_func(v, stack[-1])
        while len(stack) > 1 and depth[stack[-1]] > depth[lca]:
            top = stack.pop()
            if depth[stack[-1]] >= depth[lca]:
                edges.append((stack[-1], top))
            else:
                edges.append((lca, top))
        if stack[-1] != lca:
            top = stack.pop()
            edges.append((lca, top))
            stack.append(lca)
        if stack[-1] != v:
            stack.append(v)

    while len(stack) > 1:
        top = stack.pop()
        edges.append((stack[-1], top))

    return all_verts, edges
```

### 計算量

| 項目 | 計算量 |
|------|--------|
| ソート | $O(k \log k)$ |
| LCA 計算 | $O(k \log n)$ (前処理により) |
| 辺構築 | $O(k)$ |
| 全体 | $O(k \log n)$ |

前処理として LCA のためにオイラーツアーと Sparse Table ($O(n \log n)$) を構築しておけば、各 LCA クエリは $O(1)$ で回答できる。

## LCA の前処理

### オイラーツアー + Sparse Table

最も一般的な前処理は以下の通り:

1. 木をオイラーツアーで走査し、訪問順と深さの配列を作る
2. LCA(u, v) はオイラーツアー上で u と v の間の最小深さの頂点
3. Range Minimum Query (RMQ) を Sparse Table で前処理

全体の前処理は $O(n \log n)$、各クエリは $O(1)$。

## 応用

### 木上の DP を少数の重要頂点に限定

元の木全体に対する DP が $O(n)$ であっても、クエリごとに $O(n)$ かかると計 $O(qn)$ になる。Auxiliary Tree を使えばクエリごとに $O(k)$ で済む。

### 典型的な使用場面

- Steiner Tree 問題: 指定頂点集合を連結する最小部分木
- 木上の最短路クエリ: 特定の頂点集合に関する距離計算
- クエリごとに重要な頂点が異なる木 DP

### Steiner Tree との関係

$k$ 個の指定頂点を連結する最小部分木 (Steiner Tree) のコストは、Auxiliary Tree の辺のコストの合計に等しい。ここで各辺のコストは元の木における 2 頂点間の距離である。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 根付き木 $T$ と頂点集合 $S$ ($|S| = k$) |
| 出力 | Auxiliary Tree (高々 $2k-1$ 頂点) |
| 構築時間 | $O(k \log n)$ |
| 前処理 | $O(n \log n)$ (LCA) |
| 核心 | DFS 順ソートと隣接ペアの LCA |
| 応用 | Steiner Tree、木DP、パスクエリ |
