---
title: "ビットDP 解説"
---

## ビットDP とは

ビットDP (Bitmask DP) は、$n$ 個の要素からなる集合の部分集合をビットマスク (整数) で表現し、DPの状態として管理するテクニックである。

$n$ 個の要素の各部分集合は $0$ から $2^n - 1$ の整数に 1 対 1 対応する。要素 $i$ が集合に含まれるかどうかは、整数のビット $i$ が 1 か 0 かで判定する。

### 代表的な問題: 巡回セールスマン問題 (TSP)

$n$ 個の都市を全て 1 回ずつ訪問して出発点に戻る最短経路を求める。

## 状態の定義

$dp[S][v]$ を「集合 $S$ に含まれる都市を全て訪問し、最後に都市 $v$ にいるときの最小コスト」と定義する。

ここで $S$ はビットマスクで、$v \in S$ が必要。

### 漸化式

$$
dp[S][v] = \min_{u \in S \setminus \{v\}} \left( dp[S \setminus \{v\}][u] + d(u, v) \right)
$$

### 初期条件

出発都市を 0 とすると:

$$
dp[\{0\}][0] = 0
$$

### 求める答え

$$
\min_{v} \left( dp[\{0,1,\ldots,n-1\}][v] + d(v, 0) \right)
$$

## 実装

```python title="tsp_bitmask.py"
def tsp(dist: list[list[int]]) -> int:
    n = len(dist)
    INF = float('inf')
    full = (1 << n) - 1
    dp = [[INF] * n for _ in range(1 << n)]
    dp[1][0] = 0  # Start at city 0

    for mask in range(1, 1 << n):
        for u in range(n):
            if not (mask & (1 << u)):
                continue
            if dp[mask][u] == INF:
                continue
            for v in range(n):
                if mask & (1 << v):
                    continue
                new_mask = mask | (1 << v)
                new_cost = dp[mask][u] + dist[u][v]
                dp[new_mask][v] = min(dp[new_mask][v], new_cost)

    # Return to start
    ans = INF
    for u in range(n):
        ans = min(ans, dp[full][u] + dist[u][0])
    return ans
```

## 計算量

### 命題: TSP のビットDPは $O(2^n \cdot n^2)$ で計算できる

**証明:**

DPテーブルのサイズは $2^n \times n$ である。各状態 $(S, u)$ について、高々 $n$ 個の都市 $v$ への遷移を考える。

したがって全体の遷移数は $O(2^n \cdot n \cdot n) = O(2^n \cdot n^2)$ であり、各遷移は $O(1)$ なので、時間計算量は $O(2^n \cdot n^2)$ である。 $\square$

$n = 20$ 程度まで実用的に計算可能。

## ビット操作の基本

| 操作 | コード | 意味 |
|------|--------|------|
| 要素 $i$ を追加 | `S \| (1 << i)` | 集合 $S$ に $i$ を追加 |
| 要素 $i$ を削除 | `S & ~(1 << i)` | 集合 $S$ から $i$ を削除 |
| 要素 $i$ の存在判定 | `S & (1 << i)` | $i \in S$ かどうか |
| 全体集合 | `(1 << n) - 1` | $\{0, 1, \ldots, n-1\}$ |
| 部分集合の列挙 | `sub = (sub - 1) & S` | $S$ の部分集合を降順に列挙 |

## 部分集合の列挙

ビットマスク $S$ の全ての部分集合を列挙するテクニック:

```python title="enumerate_subsets.py"
def enumerate_subsets(S: int):
    sub = S
    while sub > 0:
        # Process subset sub
        yield sub
        sub = (sub - 1) & S
    yield 0  # Empty set
```

このループの全ての $S$ に対する合計反復回数は $O(3^n)$ である (各要素が「$S$ に含まれない」「$S$ に含まれ sub にも含まれる」「$S$ に含まれるが sub には含まれない」の 3 択)。

## 応用例

- **巡回セールスマン問題**: 上述
- **ハミルトン路/閉路**: 全頂点を 1 回ずつ訪問するパスの存在判定
- **割当問題**: $n$ 人を $n$ 個の仕事に割り当てる最小コスト
- **集合被覆**: 最小個数の集合で全要素をカバー

## まとめ

| 項目 | 内容 |
|------|------|
| 適用対象 | 集合の部分集合に関する最適化・数え上げ |
| 時間計算量 | $O(2^n \cdot n^k)$ ($k$ は遷移の複雑さ) |
| 空間計算量 | $O(2^n \cdot n)$ |
| 核心 | 部分集合をビットマスクで整数として管理 |
| 制約 | $n \leq 20$ 程度 |
