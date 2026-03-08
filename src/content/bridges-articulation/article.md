---
title: "橋・関節点検出 解説"
---

## 橋と関節点

無向連結グラフにおいて:

- **橋 (bridge)**: 削除するとグラフが非連結になる辺
- **関節点 (articulation point, cut vertex)**: 削除するとグラフが非連結になる頂点

これらはグラフの**脆弱な箇所**を表し、ネットワークの信頼性分析で重要な概念である。

## Low-link 値

DFS を行い、各頂点 $u$ に以下の2つの値を割り当てる:

- $\text{disc}[u]$: DFS 発見時刻
- $\text{low}[u]$: $u$ から DFS 木の辺と**高々1本の後退辺**を使って到達できる頂点の最小発見時刻

### Low の計算

$$
\text{low}[u] = \min\begin{cases}
\text{disc}[u] \\
\text{low}[v] & \text{($v$ は $u$ の DFS 木の子)} \\
\text{disc}[w] & \text{($w$ は後退辺 $(u,w)$ の先)}
\end{cases}
$$

## 橋の検出条件

DFS 木で $u$ が $v$ の親のとき、辺 $(u, v)$ が橋であるための必要十分条件:

$$
\text{low}[v] > \text{disc}[u]
$$

### 直感的な理解

$\text{low}[v] > \text{disc}[u]$ は、$v$ の部分木から後退辺を使っても $u$ またはそれ以前の頂点に到達できないことを意味する。したがって辺 $(u, v)$ を除去すると $v$ の部分木が孤立する。

## 関節点の検出条件

頂点 $u$ が関節点であるための条件:

1. **$u$ が DFS 木の根**: DFS 木での子が 2 つ以上
2. **$u$ が根でない**: ある子 $v$ に対して $\text{low}[v] \geq \text{disc}[u]$

### なぜ根の条件が異なるか

根以外の頂点 $u$ では、$\text{low}[v] \geq \text{disc}[u]$ なら $v$ の部分木から $u$ を経由せずに $u$ の祖先に到達できない。$u$ を削除すると $v$ の部分木が切り離される。

根の場合、$\text{low}[v] \geq \text{disc}[u]$ は常に成り立つ (根の disc が最小) ので使えない。代わりに DFS 木での子の数で判定する。子が 2 つ以上なら、根を削除すると各子の部分木が分離される。

## 実装

```python title="bridges_and_articulation_points.py"
def find_bridges_and_aps(n: int, edges: list[tuple[int, int]]):
    adj = [[] for _ in range(n)]
    for i, (u, v) in enumerate(edges):
        adj[u].append((v, i))
        adj[v].append((u, i))

    disc = [-1] * n
    low = [-1] * n
    timer = [0]
    bridges = []
    aps = set()

    def dfs(u: int, parent_edge: int):
        disc[u] = low[u] = timer[0]
        timer[0] += 1
        children = 0

        for v, idx in adj[u]:
            if idx == parent_edge:
                continue
            if disc[v] == -1:
                children += 1
                dfs(v, idx)
                low[u] = min(low[u], low[v])

                # Bridge
                if low[v] > disc[u]:
                    bridges.append((u, v))

                # Articulation point (non-root)
                if parent_edge != -1 and low[v] >= disc[u]:
                    aps.add(u)
            else:
                low[u] = min(low[u], disc[v])

        # Articulation point (root)
        if parent_edge == -1 and children > 1:
            aps.add(u)

    for i in range(n):
        if disc[i] == -1:
            dfs(i, -1)

    return bridges, aps
```

## 橋と関節点の関係

- 橋の両端の少なくとも一方は関節点 (次数 1 の頂点を除く)
- 関節点があっても橋があるとは限らない (例: 3 頂点の完全グラフの中心頂点は関節点だが橋はない)

## 計算量

| 操作 | 計算量 |
|------|--------|
| DFS | $O(V + E)$ |
| **合計** | $O(V + E)$ |

## 応用

- **ネットワーク設計**: 単一障害点の特定
- **道路ネットワーク**: 切断されると到達不能になる道路・交差点
- **通信ネットワーク**: 冗長性の評価
- **二重連結成分分解**: 橋・関節点検出は二重連結成分分解の前処理

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 無向連結グラフ |
| 出力 | 橋のリスト + 関節点の集合 |
| 時間計算量 | $O(V + E)$ |
| 空間計算量 | $O(V + E)$ |
| 核心 | DFS + low-link 値 |
| 応用 | ネットワーク信頼性、二重連結成分分解 |
