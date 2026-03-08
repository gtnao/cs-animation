---
title: "Block Cut Tree 解説"
---

## Block Cut Tree とは

**Block Cut Tree** (ブロックカット木) は、無向グラフの**二重連結成分 (biconnected component, block)** と**関節点 (articulation point, cut vertex)** の関係を木構造で表現したものである。

### 基本概念

- **関節点**: 削除するとグラフの連結成分数が増える頂点
- **二重連結成分 (ブロック)**: 関節点を含まない極大な辺集合。すなわち、どの辺を除いても連結であるような極大部分グラフ
- **橋**: 削除するとグラフが非連結になる辺 (2頂点のブロック)

### Block Cut Tree の構造

Block Cut Tree は以下のノードを持つ二部木である:

1. **ブロックノード**: 各二重連結成分に対応
2. **カットノード**: 各関節点に対応

ブロックノードとカットノードの間に辺があるのは、その関節点がそのブロックに含まれる場合である。

## 二重連結成分の検出

### Tarjan のアルゴリズム

DFS を行い、各頂点 $v$ に対して:
- $\text{disc}[v]$: DFS の訪問順序
- $\text{low}[v]$: $v$ から DFS 木の辺と高々 1 本の後退辺を使って到達できる頂点の最小 disc 値

### 関節点の条件

頂点 $u$ が関節点であるのは以下のいずれかの場合:

1. $u$ が DFS 木の根で、2 つ以上の子を持つ
2. $u$ が根でなく、ある子 $v$ に対して $\text{low}[v] \geq \text{disc}[u]$

### 実装

```python title="block_cut_tree.py"
def build_block_cut_tree(n: int, adj: list[list[int]]):
    disc = [-1] * n
    low = [-1] * n
    parent = [-1] * n
    timer = [0]
    art_points = set()
    blocks = []
    edge_stack = []

    def dfs(u: int) -> None:
        disc[u] = low[u] = timer[0]
        timer[0] += 1
        child_count = 0

        for v in adj[u]:
            if disc[v] == -1:
                child_count += 1
                parent[v] = u
                edge_stack.append((u, v))
                dfs(v)
                low[u] = min(low[u], low[v])

                is_root = parent[u] == -1
                if (is_root and child_count > 1) or \
                   (not is_root and low[v] >= disc[u]):
                    art_points.add(u)
                    # Extract block
                    block = set()
                    while edge_stack:
                        a, b = edge_stack.pop()
                        block.add(a)
                        block.add(b)
                        if (a, b) == (u, v):
                            break
                    blocks.append(list(block))

            elif v != parent[u] and disc[v] < disc[u]:
                edge_stack.append((u, v))
                low[u] = min(low[u], disc[v])

    for s in range(n):
        if disc[s] == -1:
            dfs(s)
            if edge_stack:
                block = set()
                while edge_stack:
                    a, b = edge_stack.pop()
                    block.add(a)
                    block.add(b)
                blocks.append(list(block))

    # Build Block Cut Tree
    # Node IDs: 0..n-1 for original vertices, n..n+len(blocks)-1 for blocks
    bct_adj = [[] for _ in range(n + len(blocks))]
    for i, block in enumerate(blocks):
        block_id = n + i
        for v in block:
            if v in art_points:
                bct_adj[v].append(block_id)
                bct_adj[block_id].append(v)

    return blocks, list(art_points), bct_adj
```

## 計算量

| 項目 | 計算量 |
|------|--------|
| 時間計算量 | $O(V + E)$ |
| 空間計算量 | $O(V + E)$ |

## Block Cut Tree の性質

### 木構造

連結グラフに対して、Block Cut Tree は必ず木になる。これは各ブロックが辺素であることから導かれる。

### 二部性

Block Cut Tree はブロックノードとカットノードからなる二部グラフ (木) である。

### 頂点の所属

- 関節点は複数のブロックに属する
- 関節点でない頂点はちょうど 1 つのブロックに属する

### パスの対応

元のグラフで頂点 $u$ から $v$ への任意のパスは、Block Cut Tree 上の $u$-$v$ パスに含まれる全てのブロックとカット頂点を通る。

## 応用

### 2-頂点連結性のクエリ

2 頂点 $u, v$ が同じブロックに属するかは Block Cut Tree 上で判定できる。同じブロックに属するなら $u$-$v$ 間に 2 つの頂点素なパスが存在する。

### 関節点の列挙

Block Cut Tree のカットノード (次数 2 以上) が関節点である。

### 頂点削除の影響

頂点 $v$ を削除したときに何個の連結成分に分かれるかは、Block Cut Tree 上で $v$ のカットノードとしての次数から求められる。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 無向グラフ $G = (V, E)$ |
| 出力 | Block Cut Tree |
| 時間計算量 | $O(V + E)$ |
| 空間計算量 | $O(V + E)$ |
| 核心 | DFS で disc/low を計算し二重連結成分を検出 |
| 応用 | 連結性クエリ、関節点列挙、頂点削除の影響分析 |
