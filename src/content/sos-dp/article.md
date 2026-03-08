---
title: "SOS DP 解説"
---

## SOS DP とは

SOS DP (Sum over Subsets DP) は、$n$ ビットのマスク $S$ に対して、$S$ の全部分集合にわたる値の総和を $O(n \cdot 2^n)$ で計算するテクニックである。

$$
F[S] = \sum_{T \subseteq S} a[T]
$$

素朴に全部分集合を列挙すると $O(3^n)$ かかるが、SOS DP はこれを $O(n \cdot 2^n)$ に改善する。

### $O(3^n)$ の由来

素朴な方法では、各マスク $S$ に対してその全部分集合 $T$ を列挙する。全マスク $S$ にわたる部分集合の総数は:

$$
\sum_{S} 2^{|S|} = \sum_{k=0}^{n} \binom{n}{k} 2^k = (1 + 2)^n = 3^n
$$

二項定理による。$n = 20$ の場合、$3^{20} \approx 3.5 \times 10^9$ で制限時間に間に合わないが、$20 \times 2^{20} \approx 2 \times 10^7$ なら十分高速である。

## アルゴリズム

高速ゼータ変換とも呼ばれる。各ビット位置を 1 つずつ処理する:

```python title="sos_dp.py"
def sos(a: list[int], n: int) -> list[int]:
    dp = list(a)
    for bit in range(n):
        for mask in range(1 << n):
            if mask & (1 << bit):
                dp[mask] += dp[mask ^ (1 << bit)]
    return dp
```

### なぜ正しいか: 帰納法による証明

$dp_k[S]$ をビット $0$ から $k-1$ まで処理した後の $dp[S]$ の値と定義する。初期値は $dp_0[S] = a[S]$。

**命題:** ビット $k$ まで処理した後、以下が成り立つ:

$$
dp_k[S] = \sum_{\substack{T \subseteq S \\ T \text{ と } S \text{ はビット } k \text{ 以上で一致}}} a[T]
$$

より正確には、$T$ は $S$ のビット $0$ からビット $k-1$ の任意の部分集合を取り得るが、ビット $k$ 以上は $S$ と一致する。

**証明 (帰納法):**

**基底:** $k = 0$ のとき $dp_0[S] = a[S]$。ビット 0 以上の全てで $S$ と一致する唯一の集合は $S$ 自身なので正しい。

**帰納ステップ:** $k$ から $k+1$ への遷移を考える。ビット $k$ を処理するとき:

- **$S$ のビット $k$ が $0$ の場合:** $dp_{k+1}[S] = dp_k[S]$ (何もしない)。ビット $k$ が $0$ なので、$T$ のビット $k$ も $0$ でなければ $T \subseteq S$ にならない。したがって帰納法の仮定がそのまま成り立つ。

- **$S$ のビット $k$ が $1$ の場合:** $S' = S \oplus (1 \ll k)$ (ビット $k$ を反転) として:

$$
dp_{k+1}[S] = dp_k[S] + dp_k[S']
$$

帰納法の仮定より、$dp_k[S]$ は「ビット $k$ 以上で $S$ と一致する $T$ にわたる和」、$dp_k[S']$ は「ビット $k$ 以上で $S'$ と一致する $T$ にわたる和」。$S'$ は $S$ からビット $k$ を $0$ にしたものなので、$dp_k[S']$ はビット $k$ が $0$ で他のビット $k$ 以上が $S$ と一致する $T$ にわたる和。

合計すると、ビット $k$ が $0$ でも $1$ でもよく、ビット $k+1$ 以上で $S$ と一致する全ての $T$ にわたる和になる。これは帰納法の主張を $k+1$ に拡張したものである。 $\square$

$k = n$ で全ビット処理完了後、$dp_n[S] = \sum_{T \subseteq S} a[T]$ が得られる。

## 計算量

### 命題: SOS DP は $O(n \cdot 2^n)$

**証明:**

外側のループが $n$ 回、内側のループが $2^n$ 回で、各反復は $O(1)$。したがって全体は $O(n \cdot 2^n)$。 $\square$

## メビウス変換 (逆変換)

SOS (ゼータ変換) の逆変換であるメビウス変換は、加算を減算に変えるだけ:

```python title="mobius.py"
def mobius(dp: list[int], n: int) -> list[int]:
    for bit in range(n):
        for mask in range(1 << n):
            if mask & (1 << bit):
                dp[mask] -= dp[mask ^ (1 << bit)]
    return dp
```

**正しさ:** ゼータ変換を行列で表すと、各ビットについての変換行列は $I + E_k$ ($E_k$ はビット $k$ に対応する行列) の形をしている。メビウス変換は $I - E_k$ を同じ順序で適用したもので、$(I + E_k)(I - E_k) = I$ (なぜなら $E_k^2 = E_k$ で $\mathbb{F}_2$ 上の性質) により逆変換になる。

## 包除原理との関係

SOS DP は包除原理と深い関係がある。包除原理を集合関数の言葉で述べると:

$g[S] = \sum_{T \subseteq S} f[T]$ (ゼータ変換) であるとき、逆変換は:

$$
f[S] = \sum_{T \subseteq S} (-1)^{|S| - |T|} g[T]
$$

これは**メビウスの反転公式**の半順序集合版である。SOS DP のゼータ変換とメビウス変換はまさにこの関係を計算している。

**応用例:** 「ちょうど集合 $S$ と一致する要素の数」を「$S$ の部分集合に含まれる要素の数」から復元する問題では、ゼータ変換の後にメビウス変換を適用する。

## 上位集合の和 (Superset Sum)

部分集合の和ではなく、$S$ を**含む**全ての上位集合にわたる和を求めたい場合もある:

$$
G[S] = \sum_{S \subseteq T} a[T]
$$

これは条件を反転させるだけでよい:

```python title="superset_sum.py"
def superset_sum(a: list[int], n: int) -> list[int]:
    dp = list(a)
    for bit in range(n):
        for mask in range(1 << n):
            if not (mask & (1 << bit)):
                dp[mask] += dp[mask | (1 << bit)]
    return dp
```

ビットが $0$ のときに、そのビットを $1$ にした値を加算する。正しさも同様に帰納法で示せる。

## 集合の畳み込み (AND/OR 畳み込み)

### OR 畳み込み

2 つの配列 $a, b$ に対して、OR 畳み込みを以下で定義する:

$$
c[S] = \sum_{T_1 \cup T_2 = S} a[T_1] \cdot b[T_2]
$$

しかしこの直接計算は遅い。**ゼータ変換**を用いると効率的に計算できる:

1. $\hat{a} = \text{zeta}(a)$, $\hat{b} = \text{zeta}(b)$ を計算 (SOS DP)
2. 各 $S$ について $\hat{c}[S] = \hat{a}[S] \cdot \hat{b}[S]$ (要素ごとの積)
3. $c = \text{mobius}(\hat{c})$ で逆変換

全体で $O(n \cdot 2^n)$ で計算できる。

### AND 畳み込み

$$
c[S] = \sum_{T_1 \cap T_2 = S} a[T_1] \cdot b[T_2]
$$

こちらは上位集合の和 (superset sum) をゼータ変換として使い、対応するメビウス変換で逆変換する。

```python title="and_convolution.py"
def and_convolution(a: list[int], b: list[int], n: int) -> list[int]:
    # Zeta transform (superset sum)
    fa, fb = list(a), list(b)
    for bit in range(n):
        for mask in range(1 << n):
            if not (mask & (1 << bit)):
                fa[mask] += fa[mask | (1 << bit)]
                fb[mask] += fb[mask | (1 << bit)]
    # Pointwise product
    fc = [fa[i] * fb[i] for i in range(1 << n)]
    # Mobius inverse (superset)
    for bit in range(n):
        for mask in range(1 << n):
            if not (mask & (1 << bit)):
                fc[mask] -= fc[mask | (1 << bit)]
    return fc
```

## 競プロでの適用例

### 典型問題: 共通ビットを持つペアの数

**問題:** $n$ 個の非負整数 $a_1, a_2, \ldots, a_m$ が与えられる。$a_i \text{ AND } a_j = 0$ となるペア $(i, j)$ の数を求めよ。

**解法:**
1. $\text{cnt}[S]$ = 値がちょうど $S$ であるような $a_i$ の個数
2. SOS DP で $F[S] = \sum_{T \subseteq S} \text{cnt}[T]$ を計算
3. 各 $a_i$ に対して、$a_i \text{ AND } a_j = 0$ となる $a_j$ は $a_i$ の補集合 $\overline{a_i}$ の部分集合
4. 答えは $\sum_{i} F[\overline{a_i}]$

SOS DP により $F$ は $O(n \cdot 2^n)$ で計算でき、素朴な $O(m^2)$ を大幅に改善する。

### 典型問題: 部分集合の最大 XOR

SOS DP の変種として、和の代わりに他の演算 (max, min, gcd など) を用いることもある。ただし逆変換が存在するのは加法群の場合のみであることに注意。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $2^n$ の配列 |
| 出力 | 各マスクの全部分集合の総和 |
| 時間計算量 | $O(n \cdot 2^n)$ |
| 空間計算量 | $O(2^n)$ |
| 核心 | 各ビットを 1 つずつ処理して差分更新 |
| 応用 | 集合畳み込み、包除原理、競プロ全般 |
