---
title: "Lucasの定理 解説"
---

## Lucasの定理とは

Lucasの定理は、素数 $p$ に対して二項係数 $\binom{n}{k} \bmod p$ を、$n$ と $k$ の $p$ 進展開を利用して効率的に計算する定理である。

### 定理の主張

$p$ を素数とし、$n$ と $k$ を非負整数とする。$n$ と $k$ の $p$ 進展開を

$$
n = n_s p^s + n_{s-1} p^{s-1} + \cdots + n_1 p + n_0
$$

$$
k = k_s p^s + k_{s-1} p^{s-1} + \cdots + k_1 p + k_0
$$

とすると、

$$
\binom{n}{k} \equiv \prod_{i=0}^{s} \binom{n_i}{k_i} \pmod{p}
$$

が成り立つ。ただし $k_i > n_i$ となる桁が一つでもあれば $\binom{n}{k} \equiv 0 \pmod{p}$ である。

## 直感的な理解

Lucasの定理は「大きな二項係数を、各桁ごとの小さな二項係数の積に分解できる」ことを述べている。

例えば $p = 3$ のとき、$\binom{10}{3}$ を計算したい場合:

- $10 = 1 \cdot 3^2 + 0 \cdot 3 + 1 = (101)_3$
- $3 = 0 \cdot 3^2 + 1 \cdot 3 + 0 = (010)_3$

$$
\binom{10}{3} \equiv \binom{1}{0} \cdot \binom{0}{1} \cdot \binom{1}{0} \pmod{3}
$$

$\binom{0}{1} = 0$ なので $\binom{10}{3} \equiv 0 \pmod{3}$ となる。実際 $\binom{10}{3} = 120 = 40 \times 3$ なので正しい。

## 証明の概略

### 補題: $(1 + x)^p \equiv 1 + x^p \pmod{p}$

$p$ が素数のとき、$1 \leq k \leq p-1$ に対して $\binom{p}{k} \equiv 0 \pmod{p}$ である。これは $\binom{p}{k} = \frac{p!}{k!(p-k)!}$ の分子が $p$ で割り切れ、分母は $p$ で割り切れないことから従う。

### 本証明

$(1+x)^n$ の $x^k$ の係数が $\binom{n}{k}$ であることを利用する。

$n = qp + r$ ($0 \leq r < p$) と書くと、

$$
(1+x)^n = (1+x)^{qp+r} = ((1+x)^p)^q \cdot (1+x)^r \equiv (1+x^p)^q \cdot (1+x)^r \pmod{p}
$$

両辺の $x^k$ の係数を比較すると、$k = jp + i$ ($0 \leq i < p$) のとき

$$
\binom{n}{k} \equiv \binom{q}{j} \binom{r}{i} \pmod{p}
$$

これを再帰的に適用すれば定理が得られる。 $\square$

## 実装

```python title="lucas.py"
def lucas(n: int, k: int, p: int) -> int:
    """Lucas's theorem: C(n, k) mod p"""
    if k > n:
        return 0
    if k == 0:
        return 1

    result = 1
    while n > 0 or k > 0:
        ni = n % p
        ki = k % p
        if ki > ni:
            return 0
        # Compute C(ni, ki) mod p for small values
        result = result * small_binom(ni, ki, p) % p
        n //= p
        k //= p
    return result

def small_binom(n: int, k: int, p: int) -> int:
    """C(n, k) mod p for n, k < p"""
    if k > n:
        return 0
    if k == 0 or k == n:
        return 1
    num = 1
    den = 1
    for i in range(k):
        num = num * (n - i) % p
        den = den * (i + 1) % p
    return num * pow(den, p - 2, p) % p
```

## 計算量

| 処理 | 時間計算量 |
|------|-----------|
| Lucas の定理 | $O(\log_p n \cdot p)$ |
| 前処理なし | 直接計算可能 |

$p$ が小さい場合に特に効率的である。$p$ が大きい場合は階乗テーブルによる方法の方が速い。

## Lucasの定理が有用な場面

1. **$n$ が非常に大きく $p$ が小さい場合**: 階乗テーブルは $O(n)$ のメモリを要するが、Lucasの定理は $O(p)$ で済む
2. **$n \geq p$ の場合**: 通常の階乗テーブル法では $n! \equiv 0 \pmod{p}$ となり逆元が計算できないが、Lucasの定理なら計算可能

## 具体例

### 例1: $\binom{100}{30} \bmod 7$

$100 = (202)_7$, $30 = (42)_7$ (ゼロパディングして $(042)_7$)

$$
\binom{100}{30} \equiv \binom{2}{0} \cdot \binom{0}{4} \cdot \binom{2}{2} \pmod{7}
$$

$\binom{0}{4} = 0$ なので $\binom{100}{30} \equiv 0 \pmod{7}$。

### 例2: $\binom{7}{3} \bmod 5$

$7 = (12)_5$, $3 = (03)_5$

$$
\binom{7}{3} \equiv \binom{1}{0} \cdot \binom{2}{3} \pmod{5}
$$

$\binom{2}{3} = 0$ なので $\binom{7}{3} \equiv 0 \pmod{5}$。実際 $\binom{7}{3} = 35 = 7 \times 5$。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n, k$ と素数 $p$ |
| 出力 | $\binom{n}{k} \bmod p$ |
| 時間計算量 | $O(\log_p n \cdot p)$ |
| 核心 | $p$ 進展開による分解 |
| 利点 | $n \geq p$ でも計算可能 |
