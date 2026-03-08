---
title: "ハミルトン路 DP 解説"
---

## ハミルトン路とは

### 定義

- **ハミルトン路 (Hamiltonian path)**: グラフの全ての頂点をちょうど1回ずつ通る経路
- **ハミルトン閉路 (Hamiltonian cycle)**: 始点と終点が同じハミルトン路

### オイラー路との違い

| | オイラー路 | ハミルトン路 |
|---|---|---|
| 条件 | 全**辺**を1回通る | 全**頂点**を1回通る |
| 判定 | 多項式時間 | NP 完全 |
| 効率的アルゴリズム | $O(V + E)$ | $O(2^n \cdot n^2)$ (DP) |

## ビットマスク DP

### アイデア

頂点集合を**ビットマスク** (整数のビットで頂点の訪問状態を表す) で管理し、動的計画法で解く。

### 状態の定義

$$
\text{dp}[S][v] = \begin{cases}
\text{true} & \text{頂点集合 $S$ をちょうど訪問し、最後に頂点 $v$ にいることが可能} \\
\text{false} & \text{そうでない}
\end{cases}
$$

ここで $S$ は頂点集合を表すビットマスク ($0 \leq S < 2^n$)、$v \in S$ である。

### 初期条件

各頂点 $v$ について:

$$
\text{dp}[\{v\}][v] = \text{true}
$$

### 遷移

$\text{dp}[S][u] = \text{true}$ かつ辺 $(u, v) \in E$ かつ $v \notin S$ のとき:

$$
\text{dp}[S \cup \{v\}][v] = \text{true}
$$

### 答え

ある $v$ に対して $\text{dp}[\{0, 1, \ldots, n-1\}][v] = \text{true}$ ならハミルトン路が存在する。

## 実装

```python title="hamiltonian_path.py"
def hamiltonian_path(n: int, edges: list[tuple[int, int]]) -> list[int] | None:
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)

    full = (1 << n) - 1
    dp = [[False] * n for _ in range(1 << n)]
    parent = [[None] * n for _ in range(1 << n)]

    # Base case
    for v in range(n):
        dp[1 << v][v] = True

    # DP transition
    for mask in range(1, full + 1):
        for u in range(n):
            if not (mask & (1 << u)):
                continue
            if not dp[mask][u]:
                continue
            for v in adj[u]:
                if mask & (1 << v):
                    continue
                new_mask = mask | (1 << v)
                if not dp[new_mask][v]:
                    dp[new_mask][v] = True
                    parent[new_mask][v] = (mask, u)

    # Find path
    for v in range(n):
        if dp[full][v]:
            # Reconstruct path
            path = []
            cur_mask, cur_node = full, v
            while cur_node is not None:
                path.append(cur_node)
                p = parent[cur_mask][cur_node]
                if p is None:
                    break
                cur_mask, cur_node = p
            path.reverse()
            return path

    return None
```

## 計算量

### 時間計算量

- 状態数: $O(2^n \cdot n)$
- 各状態での遷移: $O(n)$ (隣接頂点の走査)
- **合計**: $O(2^n \cdot n^2)$

### 空間計算量

- DP テーブル: $O(2^n \cdot n)$

## NP 完全性との関係

ハミルトン路問題は NP 完全問題であり、多項式時間アルゴリズムは (P $\neq$ NP ならば) 存在しない。

ビットマスク DP は指数時間アルゴリズムだが、素朴な全探索 $O(n!)$ に比べて大幅に効率的である:

| $n$ | $n!$ | $2^n \cdot n^2$ |
|-----|------|-----------------|
| 10 | 3,628,800 | 102,400 |
| 15 | $1.3 \times 10^{12}$ | 7,372,800 |
| 20 | $2.4 \times 10^{18}$ | $4.2 \times 10^8$ |

$n \leq 20$ 程度であればビットマスク DP で現実的な時間で解ける。

## ハミルトン閉路への拡張

ハミルトン閉路を求めるには、始点を固定して (例えば頂点 0)、$\text{dp}[\text{full}][v]$ が true かつ辺 $(v, 0)$ が存在する $v$ を探せばよい。

始点を固定しても一般性を失わない (閉路なのでどこから始めても同じ)。

## 応用

- **巡回セールスマン問題 (TSP)**: 重み付きグラフで最小重みのハミルトン閉路を求める
- **スケジューリング**: 全工程を1回ずつ通る最適順序
- **DNA 配列**: 断片の重なりから最短の上位配列を構築

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 無向/有向グラフ |
| 出力 | ハミルトン路 (存在すれば) |
| 時間計算量 | $O(2^n \cdot n^2)$ |
| 空間計算量 | $O(2^n \cdot n)$ |
| 核心 | ビットマスクで頂点集合を表現した DP |
| 応用 | TSP、スケジューリング |
