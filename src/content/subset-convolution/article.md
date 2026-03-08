---
title: "Subset Convolution 解説"
---

## Subset Convolution とは

**Subset Convolution** は、2 つの集合関数 $f, g: 2^U \to \mathbb{R}$ に対して

$$
h(S) = \sum_{\substack{T_1 \cup T_2 = S \\ T_1 \cap T_2 = \emptyset}} f(T_1) \cdot g(T_2)
$$

を全ての $S \subseteq U$ について計算する操作である。直和 (disjoint union) に関する畳み込みともいえる。

### OR畳み込みとの違い

OR 畳み込み ($h(S) = \sum_{T_1 \cup T_2 = S} f(T_1) g(T_2)$) は $T_1 \cap T_2 = \emptyset$ の条件がない。Subset convolution は $T_1$ と $T_2$ が互いに素である必要がある。

## 素朴なアプローチ

全ての $S$ について $S$ の部分集合 $T$ を列挙し、$f(T) \cdot g(S \setminus T)$ を合計する。

```python title="subset_conv_naive.py"
def subset_conv_naive(f, g, n):
    N = 1 << n
    h = [0] * N
    for s in range(N):
        t = s
        while True:
            h[s] += f[t] * g[s ^ t]
            if t == 0:
                break
            t = (t - 1) & s
    return h
```

計算量は $O(3^n)$ (各 $S$ の部分集合数の合計が $3^n$)。

## 高速化: ランク付き多項式

### アイデア

$|T_1| + |T_2| = |S|$ (互いに素であることの必要十分条件) を利用する。

$|S|$ の情報を「ランク」として多項式に埋め込み、OR 畳み込み + 多項式の畳み込みに帰着する。

### ランク付き多項式

$f$ のランク付き版を

$$
\tilde{f}(S, z) = f(S) \cdot z^{|S|}
$$

と定義する。$z$ は形式変数で、$|S|$ の情報を保持する。

### 手順

1. **ランク付き**: $\tilde{f}[r][S] = \begin{cases} f[S] & \text{if } |S| = r \\ 0 & \text{otherwise} \end{cases}$

2. **下位集合ゼータ変換**: 各 $r$ について $\tilde{f}[r]$ をゼータ変換する。$O(2^n \cdot n)$ を $(n+1)$ 回 → $O(2^n \cdot n^2)$

3. **点ごとの多項式乗算**: 各 $S$ について

$$
\tilde{h}[r][S] = \sum_{j=0}^{r} \tilde{f}[j][S] \cdot \tilde{g}[r-j][S]
$$

$O(2^n \cdot n^2)$

4. **メビウス変換**: 各 $r$ について $\tilde{h}[r]$ をメビウス変換する。$O(2^n \cdot n^2)$

5. **抽出**: $h[S] = \tilde{h}[|S|][S]$ (ランクが $|S|$ の成分を取り出す)

### 正当性

$T_1 \cup T_2 = S$ かつ $T_1 \cap T_2 = \emptyset$ のとき、$|T_1| + |T_2| = |S|$ が成り立つ。ランク付き多項式の畳み込みにおいて、ランク $|S|$ の成分を取り出すことで、$|T_1| + |T_2| = |S|$ の条件が自動的に満たされる。

逆に、$|T_1| + |T_2| = |S|$ かつ $T_1 \cup T_2 = S$ ならば $T_1 \cap T_2 = \emptyset$ が成り立つ ($T_1 \cap T_2 \neq \emptyset$ ならば $|T_1 \cup T_2| < |T_1| + |T_2|$ となり矛盾)。

## 実装

```python title="subset_conv.py"
def subset_convolution(f, g, n):
    N = 1 << n

    # Ranked polynomials
    f_ranked = [[0] * N for _ in range(n + 1)]
    g_ranked = [[0] * N for _ in range(n + 1)]
    for s in range(N):
        pc = bin(s).count('1')
        f_ranked[pc][s] = f[s]
        g_ranked[pc][s] = g[s]

    # Zeta transform on each rank
    for r in range(n + 1):
        for i in range(n):
            for s in range(N):
                if s & (1 << i):
                    f_ranked[r][s] += f_ranked[r][s ^ (1 << i)]
                    g_ranked[r][s] += g_ranked[r][s ^ (1 << i)]

    # Pointwise ranked polynomial multiplication
    h_ranked = [[0] * N for _ in range(n + 1)]
    for s in range(N):
        for r in range(n + 1):
            for j in range(r + 1):
                h_ranked[r][s] += f_ranked[j][s] * g_ranked[r - j][s]

    # Mobius transform
    for r in range(n + 1):
        for i in range(n):
            for s in range(N):
                if s & (1 << i):
                    h_ranked[r][s] -= h_ranked[r][s ^ (1 << i)]

    # Extract
    h = [0] * N
    for s in range(N):
        h[s] = h_ranked[bin(s).count('1')][s]

    return h
```

## 計算量

| ステップ | 計算量 |
|---------|--------|
| ランク付き | $O(2^n)$ |
| ゼータ変換 $(n+1)$ 回 | $O(2^n \cdot n^2)$ |
| 点ごと多項式乗算 | $O(2^n \cdot n^2)$ |
| メビウス変換 $(n+1)$ 回 | $O(2^n \cdot n^2)$ |
| 抽出 | $O(2^n)$ |
| **合計** | $O(2^n \cdot n^2)$ |

素朴な $O(3^n)$ と比較すると、$n$ が大きい場合に大幅に高速である ($3^n / (2^n \cdot n^2) \approx 1.5^n / n^2$)。

## 応用

- **集合分割問題**: 集合を互いに素な部分集合に分割する数え上げ
- **彩色多項式**: グラフ彩色の数え上げ
- **Hamilton パスの数え上げ**: DP と組み合わせて
- **集合被覆**: 最小コスト集合被覆問題の高速化

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 2 つの集合関数 $f, g: 2^U \to \mathbb{R}$ ($|U| = n$) |
| 出力 | Subset convolution $h$ |
| 時間計算量 | $O(2^n \cdot n^2)$ |
| 空間計算量 | $O(2^n \cdot n)$ |
| 核心 | ランク付き多項式 + ゼータ/メビウス変換 |
| 素朴法との比較 | $O(3^n) \to O(2^n n^2)$ |
