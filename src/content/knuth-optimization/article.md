---
title: "Knuth's Optimization 解説"
---

## Knuth's Optimization とは

Knuth's Optimization は、区間DP:

$$
dp[i][j] = \min_{i \leq k < j} (dp[i][k] + dp[k+1][j]) + C(i, j)
$$

において、コスト関数 $C$ が**四辺形不等式** (quadrangle inequality) を満たすとき、計算量を $O(n^3)$ から $O(n^2)$ に改善するテクニックである。

## 適用条件

コスト関数 $C(i, j)$ が以下を満たすこと:

### 四辺形不等式

$$
C(a, c) + C(b, d) \leq C(a, d) + C(b, c) \quad (a \leq b \leq c \leq d)
$$

### 単調性

$$
C(b, c) \leq C(a, d) \quad (a \leq b \leq c \leq d)
$$

この条件下で、最適分割点 $\text{opt}[i][j]$ は以下を満たす:

$$
\text{opt}[i][j-1] \leq \text{opt}[i][j] \leq \text{opt}[i+1][j]
$$

## アルゴリズム

```python title="knuth_optimization.py"
def knuth(C, n):
    INF = float('inf')
    dp = [[0] * n for _ in range(n)]
    opt = [[0] * n for _ in range(n)]

    # Base case: length 1
    for i in range(n):
        opt[i][i] = i

    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            dp[i][j] = INF
            lo = opt[i][j - 1]
            hi = opt[i + 1][j] if i + 1 <= j else j
            for k in range(lo, hi + 1):
                val = dp[i][k] + dp[k + 1][j] + C(i, j)
                if val < dp[i][j]:
                    dp[i][j] = val
                    opt[i][j] = k

    return dp[0][n - 1]
```

## 計算量

### 命題: Knuth's Optimization は $O(n^2)$

**証明:**

区間長 $\text{len}$ について、全ての区間 $[i, j]$ で探索する分割点の範囲は $[\text{opt}[i][j-1], \text{opt}[i+1][j]]$。同じ $\text{len}$ の全区間にわたってこの範囲の和を取ると、テレスコーピングにより $O(n)$ となる。

区間長は $2$ から $n$ まであるので、全体は $O(n^2)$。 $\square$

## 代表的な問題

- **最適二分探索木**: アクセス頻度に基づく最適な BST 構築
- **最適括弧付け**: 行列連鎖乗算の特殊ケース

## まとめ

| 項目 | 内容 |
|------|------|
| 適用条件 | コスト関数が四辺形不等式を満たす |
| 時間計算量 | $O(n^2)$ |
| 空間計算量 | $O(n^2)$ |
| 核心 | 最適分割点の探索範囲を前後の区間の値で制限 |
| 応用 | 最適BST、括弧付け問題 |
