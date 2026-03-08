---
title: "サイクル検出 解説"
---

## サイクル検出とは

グラフにおける**サイクル (閉路)** とは、ある頂点から出発して同じ頂点に戻る経路のことである。サイクル検出は、与えられたグラフにサイクルが存在するかを判定する問題である。

有向グラフと無向グラフでは検出方法が異なる。ここでは主に**有向グラフ**のサイクル検出を扱う。

## 有向グラフのサイクル検出

### DFS による 3 色法

有向グラフのサイクル検出で最も標準的な方法は、DFS において各頂点を 3 つの状態 (色) で管理する手法である。

| 状態 | 意味 |
|------|------|
| 白 (white) | 未訪問 |
| 灰色 (gray) | 訪問済みだが、DFS がまだ完了していない (スタック上にある) |
| 黒 (black) | DFS が完了した |

### 後退辺によるサイクル検出

DFS 中に辺 $(u, v)$ を探索したとき、$v$ が灰色であれば $v$ から $u$ への DFS パスが存在し、辺 $(u, v)$ を加えるとサイクルになる。この辺を**後退辺 (back edge)** と呼ぶ。

### 定理

有向グラフ $G$ にサイクルが存在する $\Leftrightarrow$ DFS で後退辺が存在する

**証明:**

($\Rightarrow$) サイクル $v_0 \to v_1 \to \cdots \to v_k = v_0$ が存在するとする。DFS でサイクル上の頂点のうち最初に訪問される頂点を $v_i$ とする。$v_i$ の DFS が完了する前に、サイクルを辿って $v_i$ に戻る辺が探索される。このとき $v_i$ はまだ灰色なので、後退辺が検出される。

($\Leftarrow$) 後退辺 $(u, v)$ が検出されたとき、$v$ は灰色 (DFS スタック上) であり、$v$ から $u$ への DFS パスが存在する。これに辺 $(u, v)$ を加えると $v \to \cdots \to u \to v$ というサイクルになる。 $\square$

### 実装

```python title="cycle_detection.py"
def has_cycle(n: int, adj: list[list[int]]) -> bool:
    WHITE, GRAY, BLACK = 0, 1, 2
    color = [WHITE] * n

    def dfs(u: int) -> bool:
        color[u] = GRAY
        for v in adj[u]:
            if color[v] == GRAY:
                return True  # back edge found
            if color[v] == WHITE:
                if dfs(v):
                    return True
        color[u] = BLACK
        return False

    for s in range(n):
        if color[s] == WHITE:
            if dfs(s):
                return True
    return False
```

### 計算量

| 項目 | 計算量 |
|------|--------|
| 時間計算量 | $O(V + E)$ |
| 空間計算量 | $O(V)$ |

## 無向グラフのサイクル検出

無向グラフでは、DFS 中に親以外の訪問済み頂点に辺が伸びていればサイクルが存在する。

```python title="cycle_detection_undirected.py"
def has_cycle_undirected(n: int, adj: list[list[int]]) -> bool:
    visited = [False] * n

    def dfs(u: int, parent: int) -> bool:
        visited[u] = True
        for v in adj[u]:
            if not visited[v]:
                if dfs(v, u):
                    return True
            elif v != parent:
                return True
        return False

    for s in range(n):
        if not visited[s]:
            if dfs(s, -1):
                return True
    return False
```

注意: 多重辺がある場合は、頂点番号ではなく辺のインデックスで親を管理する必要がある。

## Union-Find によるサイクル検出

無向グラフでは Union-Find を使ったサイクル検出も可能である。辺を順に処理し、両端が既に同じ連結成分に属していればサイクルが存在する。

```python title="cycle_detection_uf.py"
class UnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x: int) -> int:
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x: int, y: int) -> bool:
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return False  # cycle detected
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1
        return True
```

## トポロジカルソートとの関係

有向グラフにサイクルが存在しないことは、トポロジカルソートが可能であることと同値である。

$$
\text{サイクルなし} \Leftrightarrow \text{DAG} \Leftrightarrow \text{トポロジカルソート可能}
$$

Kahn のアルゴリズム (BFS ベースのトポロジカルソート) でも、全頂点が処理されなければサイクルが存在すると判定できる。

## 応用

| 応用 | 説明 |
|------|------|
| デッドロック検出 | リソース待ちグラフのサイクル |
| 依存関係解決 | ビルドシステム、パッケージマネージャ |
| コンパイラ | 型の循環参照の検出 |
| スケジューリング | タスク間の循環依存の検出 |

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 有向/無向グラフ $G = (V, E)$ |
| 出力 | サイクルの有無 |
| 時間計算量 | $O(V + E)$ |
| 空間計算量 | $O(V)$ |
| 核心 | DFS の 3 色法で後退辺を検出 |
| 応用 | デッドロック検出、DAG 判定、依存解決 |
