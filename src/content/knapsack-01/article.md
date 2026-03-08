---
title: "ナップサック問題 (0-1) 解説"
---

## ナップサック問題 (0-1) とは

0-1 ナップサック問題は、$n$ 個の品物からいくつかを選んでナップサックに詰める問題である。各品物は**最大1個**しか選べない。容量制限を守りながら、選んだ品物の価値の合計を最大化する。

### 定式化

$n$ 個の品物があり、品物 $i$ の重さを $w_i$、価値を $v_i$ とする。ナップサックの容量を $W$ とする。

$$
\max \sum_{i=1}^{n} v_i x_i \quad \text{subject to} \quad \sum_{i=1}^{n} w_i x_i \leq W, \quad x_i \in \{0, 1\}
$$

### 具体例

品物: (重さ=2, 価値=3), (重さ=3, 価値=4), (重さ=4, 価値=5), (重さ=5, 価値=7)。容量 $W = 7$。

最適解は品物1と品物4を選ぶ (重さ=2+5=7, 価値=3+7=10)。

## 素朴なアプローチ

全ての部分集合を列挙して、容量制限を満たすもののうち価値が最大のものを探す。$2^n$ 通りあるため、計算量は $O(2^n)$ で指数時間である。

## 動的計画法

### 状態と遷移

$dp[i][w]$ を「品物 $1, 2, \ldots, i$ の中から選んで、重さの合計が $w$ 以下となる最大価値」と定義する。

遷移は以下の通り:

$$
dp[i][w] = \begin{cases}
dp[i-1][w] & \text{if } w_i > w \text{ (品物 $i$ が入らない)} \\
\max(dp[i-1][w],\ dp[i-1][w - w_i] + v_i) & \text{otherwise}
\end{cases}
$$

基底条件: $dp[0][w] = 0$ (品物を1つも選ばない場合の価値は0)。

### 直感的な理解

各品物について「入れる」か「入れない」かの二択がある。品物 $i$ を入れない場合は $dp[i-1][w]$ がそのまま引き継がれる。品物 $i$ を入れる場合は、容量 $w - w_i$ での最適解に $v_i$ を加える。

### 実装

```python title="knapsack_01.py"
def knapsack_01(weights: list[int], values: list[int], W: int) -> int:
    n = len(weights)
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for w in range(W + 1):
            dp[i][w] = dp[i - 1][w]
            if weights[i - 1] <= w:
                dp[i][w] = max(dp[i][w], dp[i - 1][w - weights[i - 1]] + values[i - 1])
    return dp[n][W]
```

### 空間最適化 (1次元DP)

容量の大きい方から更新すれば、1次元配列で十分である。

```python title="knapsack_01_optimized.py"
def knapsack_01_opt(weights: list[int], values: list[int], W: int) -> int:
    dp = [0] * (W + 1)
    for i in range(len(weights)):
        for w in range(W, weights[i] - 1, -1):  # reverse order
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])
    return dp[W]
```

**逆順に更新する理由:** 順方向に更新すると、同じ品物を複数回使ってしまう可能性がある (これは個数無制限ナップサックの解法になる)。

## 計算量

| 項目 | 値 |
|------|------|
| 時間計算量 | $O(nW)$ |
| 空間計算量 | $O(nW)$ (1次元最適化で $O(W)$) |

$n$ は品物数、$W$ は容量。これは**擬多項式時間** (pseudo-polynomial time) と呼ばれる。$W$ の値が大きいと実用的でない。

## 選んだ品物の復元

DPテーブルを逆にたどることで、実際に選んだ品物を復元できる。

```python title="knapsack_01_trace.py"
def knapsack_01_trace(weights, values, W):
    n = len(weights)
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for w in range(W + 1):
            dp[i][w] = dp[i - 1][w]
            if weights[i - 1] <= w:
                dp[i][w] = max(dp[i][w], dp[i - 1][w - weights[i - 1]] + values[i - 1])
    # Traceback
    selected = []
    w = W
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i - 1][w]:
            selected.append(i - 1)
            w -= weights[i - 1]
    return dp[n][W], selected[::-1]
```

## NP困難性

0-1 ナップサック問題は NP 困難である。擬多項式時間アルゴリズムの存在は、この問題が**弱NP困難** (weakly NP-hard) であることを意味する。

## 応用

- 資源配分問題
- 予算内での投資ポートフォリオ最適化
- 暗号理論 (subset sum problem)
- スケジューリング問題

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n$ 個の品物 (重さ $w_i$, 価値 $v_i$) と容量 $W$ |
| 出力 | 最大価値 |
| 時間計算量 | $O(nW)$ |
| 空間計算量 | $O(W)$ (1次元最適化時) |
| 核心 | 各品物について「入れる/入れない」の二択を逐次的に最適化 |
