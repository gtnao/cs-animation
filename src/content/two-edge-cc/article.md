---
title: "二重辺連結成分分解 解説"
---

## 二重辺連結成分とは

無向連結グラフにおいて、**橋 (bridge)** とは、その辺を削除するとグラフが非連結になる辺のことである。

グラフが**二重辺連結 (2-edge-connected)** であるとは、橋が存在しないことである。つまり、任意の1辺を削除してもグラフは連結のままである。

**二重辺連結成分 (2-edge-connected component)** とは、極大な二重辺連結部分グラフである。

## アルゴリズムの概要

二重辺連結成分分解は2段階で行う:

1. **橋の検出**: DFS を用いて全ての橋を見つける
2. **成分の分解**: 橋を除いた残りのグラフの連結成分が二重辺連結成分

### 橋の検出条件

DFS 木において、辺 $(u, v)$ ($u$ が親) が橋であるための必要十分条件は:

$$
\text{low}[v] > \text{disc}[u]
$$

ここで:
- $\text{disc}[u]$: 頂点 $u$ の DFS 発見時刻
- $\text{low}[u]$: 頂点 $u$ から DFS 木の辺と後退辺を使って到達できる最小の発見時刻

### なぜこの条件が正しいか

$\text{low}[v] > \text{disc}[u]$ は、$v$ の部分木から $u$ またはそれ以前に発見された頂点に後退辺で戻れないことを意味する。したがって辺 $(u, v)$ を削除すると $v$ の部分木が残りのグラフから切り離される。

## 実装

```python title="two_edge_cc.py"
def two_edge_cc(n: int, edges: list[tuple[int, int]]) -> tuple[list[tuple[int, int]], list[list[int]]]:
    adj = [[] for _ in range(n)]
    for i, (u, v) in enumerate(edges):
        adj[u].append((v, i))
        adj[v].append((u, i))

    disc = [-1] * n
    low = [-1] * n
    bridges = []
    timer = [0]

    def dfs(u: int, parent_edge: int):
        disc[u] = low[u] = timer[0]
        timer[0] += 1
        for v, idx in adj[u]:
            if idx == parent_edge:
                continue
            if disc[v] == -1:
                dfs(v, idx)
                low[u] = min(low[u], low[v])
                if low[v] > disc[u]:
                    bridges.append((u, v))
            else:
                low[u] = min(low[u], disc[v])

    for i in range(n):
        if disc[i] == -1:
            dfs(i, -1)

    # Find components by removing bridges
    bridge_set = set()
    for u, v in bridges:
        bridge_set.add((u, v))
        bridge_set.add((v, u))

    comp_id = [-1] * n
    components = []
    for i in range(n):
        if comp_id[i] != -1:
            continue
        comp = []
        stack = [i]
        comp_id[i] = len(components)
        while stack:
            u = stack.pop()
            comp.append(u)
            for v, _ in adj[u]:
                if comp_id[v] == -1 and (u, v) not in bridge_set:
                    comp_id[v] = comp_id[i]
                    stack.append(v)
        components.append(comp)

    return bridges, components
```

## 計算量

| 操作 | 計算量 |
|------|--------|
| DFS (橋検出) | $O(V + E)$ |
| 成分分解 | $O(V + E)$ |
| **合計** | $O(V + E)$ |

## 応用

- **ネットワーク信頼性**: 橋はネットワークの弱点 (single point of failure)
- **ブロックカットツリー**: 二重辺連結成分を縮約した木構造
- **冗長性の分析**: 二重辺連結成分内では、任意の辺を1本除去しても連結性が保たれる

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 無向連結グラフ |
| 出力 | 橋のリスト + 二重辺連結成分 |
| 時間計算量 | $O(V + E)$ |
| 空間計算量 | $O(V + E)$ |
| 核心 | DFS + low-link 値による橋検出 |
| 応用 | ネットワーク信頼性分析 |
