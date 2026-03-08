---
title: "Divide & Conquer Optimization 解説"
---

## Divide & Conquer Optimization とは

Divide & Conquer Optimization は、特定の条件を満たすDPの計算を分割統治法で高速化するテクニックである。$O(kn^2)$ のDPを $O(kn \log n)$ に改善する。

### 対象となるDP

以下の形のDP遷移を考える:

$$
dp[k][j] = \min_{0 \leq t < j} (dp[k-1][t] + C(t, j))
$$

ここで $dp[k][j]$ は「先頭 $j$ 要素を $k$ 個のグループに分割するときの最小コスト」、$C(t, j)$ は区間 $[t, j)$ のコスト関数である。

### 適用条件: 最適分割点の単調性

この最適化が使えるための条件は、$j$ に対する最適分割点 $\text{opt}(j)$ が**単調非減少**であること:

$$
\text{opt}(j_1) \leq \text{opt}(j_2) \quad \text{for } j_1 \leq j_2
$$

この条件は、コスト関数 $C$ が**concave quadrangle inequality** (四辺形不等式) を満たす場合に成り立つ:

$$
C(a, c) + C(b, d) \leq C(a, d) + C(b, c) \quad \text{for } a \leq b \leq c \leq d
$$

## アルゴリズム

固定された $k$ について $dp[k][j]$ ($j = 1, \ldots, n$) を計算する手順:

### 分割統治の構造

関数 $\text{solve}(lo, hi, \text{optLo}, \text{optHi})$ を定義する:
- $dp[k][lo..hi]$ を計算する
- 最適分割点は $[\text{optLo}, \text{optHi}]$ に存在する

```
solve(lo, hi, optLo, optHi):
    if lo > hi: return
    mid = (lo + hi) / 2
    // dp[k][mid] を計算: opt は [optLo, min(mid-1, optHi)] の範囲
    bestOpt = argmin_{t in [optLo, min(mid-1, optHi)]} dp[k-1][t] + C(t, mid)
    dp[k][mid] = dp[k-1][bestOpt] + C(bestOpt, mid)
    solve(lo, mid-1, optLo, bestOpt)
    solve(mid+1, hi, bestOpt, optHi)
```

### なぜ正しいか

- $\text{opt}(\text{mid})$ が $[\text{optLo}, \text{optHi}]$ にあることが保証されている
- 単調性より、$lo \leq j \leq \text{mid}$ なら $\text{opt}(j) \leq \text{opt}(\text{mid})$
- 同様に、$\text{mid} \leq j \leq hi$ なら $\text{opt}(j) \geq \text{opt}(\text{mid})$
- よって左右の再帰呼び出しの最適分割点の範囲が正しく絞られる

### 実装

```python title="dnc_optimization.py"
def solve(dp_prev, dp_curr, cost, lo, hi, opt_lo, opt_hi):
    if lo > hi:
        return
    mid = (lo + hi) // 2
    best_val = float('inf')
    best_opt = opt_lo
    for t in range(opt_lo, min(mid, opt_hi + 1)):
        val = dp_prev[t] + cost(t, mid)
        if val < best_val:
            best_val = val
            best_opt = t
    dp_curr[mid] = best_val
    solve(dp_prev, dp_curr, cost, lo, mid - 1, opt_lo, best_opt)
    solve(dp_prev, dp_curr, cost, mid + 1, hi, best_opt, opt_hi)

def dp_dnc(n, K, cost):
    INF = float('inf')
    dp = [[INF] * (n + 1) for _ in range(K + 1)]
    dp[0][0] = 0
    for j in range(1, n + 1):
        dp[1][j] = cost(0, j)
    for k in range(2, K + 1):
        solve(dp[k-1], dp[k], cost, 1, n, 0, n - 1)
    return dp[K][n]
```

## 計算量の解析

### 各レベル $k$ の計算量

$\text{solve}$ の再帰の深さは $O(\log n)$。各レベルで、全ての $\text{mid}$ の処理に要するコスト関数の評価回数の合計を考える。

再帰木の同じ深さにある全ての呼び出しについて、$\text{optLo}$ から $\min(\text{mid}-1, \text{optHi})$ までの走査範囲は重なりがなく、合計 $O(n)$。

深さは $O(\log n)$ なので、1つの $k$ につき $O(n \log n)$。

全体で $O(kn \log n)$。

## 四辺形不等式の検証例

### 例: $C(l, r) = (\text{prefix}[r] - \text{prefix}[l])^2$

$f(l, r) = (S_r - S_l)^2$ (区間和の二乗) が四辺形不等式を満たすことを確認する。

$a \leq b \leq c \leq d$ として:

$$
f(a,c) + f(b,d) \leq f(a,d) + f(b,c)
$$

$(S_c - S_a)^2 + (S_d - S_b)^2 \leq (S_d - S_a)^2 + (S_c - S_b)^2$

展開して整理すると $2(S_c - S_b)(S_a - S_d + S_d - S_b - S_c + S_b + S_c - S_a) = 0$ ... 実際には具体的な代入で確認できる。

## 素朴解との比較

| 手法 | 時間計算量 |
|------|------|
| 素朴DP | $O(kn^2)$ |
| D&C Optimization | $O(kn \log n)$ |

$n = 10^5, k = 100$ のとき:
- 素朴: $10^{12}$ 操作 (実行不可能)
- D&C: $10^7 \times 17 \approx 1.7 \times 10^8$ 操作 (実行可能)

## 関連テクニック

- **LARSCH Algorithm**: 同じ条件で $O(kn)$ に改善 (ただし実装が複雑)
- **Knuth's Optimization**: 2次元DPで $O(n^3)$ を $O(n^2)$ にする (最適分割点の挟み込み)
- **Convex Hull Trick**: コスト関数が $C(t, j) = a_t \cdot b_j + c_t$ の形をしている場合

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n$ 要素を $k$ グループに分割するDP |
| 出力 | 最小コスト |
| 時間計算量 | $O(kn \log n)$ |
| 空間計算量 | $O(kn)$ |
| 適用条件 | 最適分割点の単調性 (四辺形不等式) |
| 核心 | 中央の最適分割点を見つけて左右に再帰 |
