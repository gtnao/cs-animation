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

累積和 $S_i = \text{prefix}[i]$ として、$C(l, r) = (S_r - S_l)^2$ が四辺形不等式を満たすことを証明する。

$a \leq b \leq c \leq d$ として示すべき不等式は:

$$
C(a,c) + C(b,d) \leq C(a,d) + C(b,c)
$$

すなわち:

$$
(S_c - S_a)^2 + (S_d - S_b)^2 \leq (S_d - S_a)^2 + (S_c - S_b)^2
$$

**証明:** 簡潔のため $p = S_a, q = S_b, r = S_c, s = S_d$ とおく。$p \leq q \leq r \leq s$ (累積和は非減少) である。示すべきは:

$$
(r - p)^2 + (s - q)^2 \leq (s - p)^2 + (r - q)^2
$$

左辺と右辺の差を計算する:

$$
\text{LHS} - \text{RHS} = (r-p)^2 + (s-q)^2 - (s-p)^2 - (r-q)^2
$$

各項を展開する:
- $(r-p)^2 = r^2 - 2pr + p^2$
- $(s-q)^2 = s^2 - 2qs + q^2$
- $(s-p)^2 = s^2 - 2ps + p^2$
- $(r-q)^2 = r^2 - 2qr + q^2$

代入すると:

$$
\text{LHS} - \text{RHS} = (r^2 - 2pr + p^2) + (s^2 - 2qs + q^2) - (s^2 - 2ps + p^2) - (r^2 - 2qr + q^2)
$$

$$
= -2pr - 2qs + 2ps + 2qr = 2(p - q)(s - r)
$$

$p \leq q$ より $p - q \leq 0$、$r \leq s$ より $s - r \geq 0$。したがって:

$$
\text{LHS} - \text{RHS} = 2(p - q)(s - r) \leq 0
$$

よって $\text{LHS} \leq \text{RHS}$ が示された。 $\square$

### 四辺形不等式から最適分割点の単調性を導く

$C$ が四辺形不等式を満たすとき、なぜ最適分割点が単調になるのかを示す。

**命題:** $j_1 < j_2$ のとき $\text{opt}(j_1) \leq \text{opt}(j_2)$。

**証明:** 背理法で示す。$\text{opt}(j_1) = t_1$, $\text{opt}(j_2) = t_2$ とし、$t_1 > t_2$ と仮定する。

$t_2$ が $j_2$ に対する最適分割点なので:

$$
dp[k-1][t_2] + C(t_2, j_2) \leq dp[k-1][t_1] + C(t_1, j_2) \quad \cdots (1)
$$

$t_1$ が $j_1$ に対する最適分割点なので:

$$
dp[k-1][t_1] + C(t_1, j_1) \leq dp[k-1][t_2] + C(t_2, j_1) \quad \cdots (2)
$$

(1) + (2) より:

$$
C(t_2, j_2) + C(t_1, j_1) \leq C(t_1, j_2) + C(t_2, j_1)
$$

一方、$t_2 < t_1 \leq j_1 < j_2$ なので、四辺形不等式 ($a = t_2, b = t_1, c = j_1, d = j_2$) より:

$$
C(t_2, j_1) + C(t_1, j_2) \leq C(t_2, j_2) + C(t_1, j_1)
$$

すなわち:

$$
C(t_2, j_2) + C(t_1, j_1) \geq C(t_2, j_1) + C(t_1, j_2)
$$

これと先ほどの不等式を合わせると、全てが等号で成立しなければならない。等号成立の場合は $t_1$ も $t_2$ も $j_1, j_2$ 両方に対して最適で、$\text{opt}(j_1) \leq \text{opt}(j_2)$ となるように選び直せる。 $\square$

## 具体的な数値例によるアルゴリズムの動作追跡

配列 $a = [3, 1, 4, 1, 5]$ ($n = 5$) を $K = 2$ グループに分割するときの最小コストを考える。$C(l, r) = (S_r - S_l)^2$ とし、$S = [0, 3, 4, 8, 9, 14]$ (累積和) とする。

### 層 $k = 1$

$dp[1][j] = C(0, j) = S_j^2$:

| $j$ | 1 | 2 | 3 | 4 | 5 |
|-----|---|---|---|---|---|
| $dp[1][j]$ | 9 | 16 | 64 | 81 | 196 |

### 層 $k = 2$: solve(1, 5, 0, 4) の実行

**Step 1:** $\text{mid} = 3$

$t = 0$: $dp[1][0] + C(0, 3) = 0 + 64 = 64$
$t = 1$: $dp[1][1] + C(1, 3) = 9 + (8-3)^2 = 9 + 25 = 34$
$t = 2$: $dp[1][2] + C(2, 3) = 16 + (8-4)^2 = 16 + 16 = 32$

$\text{bestOpt} = 2$, $dp[2][3] = 32$

左再帰: solve(1, 2, 0, 2)、右再帰: solve(4, 5, 2, 4)

**Step 2 (左):** solve(1, 2, 0, 2), $\text{mid} = 1$

$t = 0$: $dp[1][0] + C(0, 1) = 0 + 9 = 9$

$\text{bestOpt} = 0$, $dp[2][1] = 9$

左再帰なし。右再帰: solve(2, 2, 0, 2)

**Step 3:** solve(2, 2, 0, 2), $\text{mid} = 2$

$t = 0$: $0 + 16 = 16$
$t = 1$: $9 + (4-3)^2 = 9 + 1 = 10$

$\text{bestOpt} = 1$, $dp[2][2] = 10$

**Step 4 (右):** solve(4, 5, 2, 4), $\text{mid} = 4$

$t = 2$: $16 + (9-4)^2 = 16 + 25 = 41$
$t = 3$: $64 + (9-8)^2 = 64 + 1 = 65$

$\text{bestOpt} = 2$, $dp[2][4] = 41$

右再帰: solve(5, 5, 2, 4)

**Step 5:** solve(5, 5, 2, 4), $\text{mid} = 5$

$t = 2$: $16 + (14-4)^2 = 16 + 100 = 116$
$t = 3$: $64 + (14-8)^2 = 64 + 36 = 100$
$t = 4$: $81 + (14-9)^2 = 81 + 25 = 106$

$\text{bestOpt} = 3$, $dp[2][5] = 100$

### 結果

$dp[2][5] = 100$。最適分割は $[3, 1, 4] | [1, 5]$ (コスト $8^2 + 6^2 = 64 + 36 = 100$)。

最適分割点の列: $\text{opt}(1) = 0 \leq \text{opt}(2) = 1 \leq \text{opt}(3) = 2 \leq \text{opt}(4) = 2 \leq \text{opt}(5) = 3$ で、確かに単調非減少である。

## 素朴解との比較

| 手法 | 時間計算量 |
|------|------|
| 素朴DP | $O(kn^2)$ |
| D&C Optimization | $O(kn \log n)$ |

$n = 10^5, k = 100$ のとき:
- 素朴: $10^{12}$ 操作 (実行不可能)
- D&C: $10^7 \times 17 \approx 1.7 \times 10^8$ 操作 (実行可能)

## 関連テクニック

### LARSCH Algorithm

LARSCH Algorithm (Larmore-Schieber Algorithm) は、同じ条件 (最適分割点の単調性) の下で各層 $k$ を $O(n)$ で計算し、全体を $O(kn)$ に改善する。

LARSCH は SMAWK Algorithm を基盤とする。$n \times n$ の totally monotone matrix (各行の最小値の列インデックスが単調非減少な行列) の全行最小値を $O(n)$ で求めるアルゴリズムである。

D&C Optimization の遷移行列 $M[j][t] = dp[k-1][t] + C(t, j)$ は、最適分割点の単調性から totally monotone matrix になる。したがって SMAWK / LARSCH を適用すれば各層 $O(n)$ で計算でき、$O(kn \log n)$ が $O(kn)$ に改善される。

ただし、LARSCH の実装は D&C Optimization に比べてかなり複雑であり、競技プログラミングでは D&C Optimization が使われることが多い。$O(\log n)$ 倍の差は定数倍の範囲で吸収されることが多いため、実用上は D&C Optimization で十分な場合がほとんどである。

### Knuth's Optimization

Knuth's Optimization は $dp[i][j] = \min_k (dp[i][k] + dp[k+1][j]) + C(i,j)$ の形の区間DPに適用する。D&C Optimization が「配列を $k$ 個の連続区間に分割」する問題向けであるのに対し、Knuth's Optimization は「区間を再帰的に2分割」する問題向けである。

### Convex Hull Trick

コスト関数が $C(t, j) = a_t \cdot b_j + c_t$ の形をしている場合は Convex Hull Trick が適用でき、こちらも $O(kn)$ (条件次第) に改善できる。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n$ 要素を $k$ グループに分割するDP |
| 出力 | 最小コスト |
| 時間計算量 | $O(kn \log n)$ |
| 空間計算量 | $O(kn)$ |
| 適用条件 | 最適分割点の単調性 (四辺形不等式) |
| 核心 | 中央の最適分割点を見つけて左右に再帰 |
