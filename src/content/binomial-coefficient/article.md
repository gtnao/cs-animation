---
title: "二項係数 (mod p) 解説"
---

## 二項係数とは

二項係数 $\binom{n}{k}$ (または $C(n, k)$) は、$n$ 個の要素から $k$ 個を選ぶ組み合わせの数である。

$$
\binom{n}{k} = \frac{n!}{k!(n-k)!}
$$

## 素数 mod での計算が必要な理由

競技プログラミングや暗号学では、二項係数の値が非常に大きくなるため、素数 $p$ での剰余を求めることが多い。典型的には $p = 10^9 + 7$ や $p = 998244353$ が使われる。

## 素朴なアプローチ

パスカルの三角形の漸化式を使えば $O(nk)$ で計算できる。

$$
\binom{n}{k} = \binom{n-1}{k-1} + \binom{n-1}{k}
$$

```python title="pascal.py"
def binom_pascal(n: int, k: int, mod: int) -> int:
    dp = [[0] * (k + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = 1
        for j in range(1, min(i, k) + 1):
            dp[i][j] = (dp[i-1][j-1] + dp[i-1][j]) % mod
    return dp[n][k]
```

しかし $n$ が大きい場合 (例えば $n = 10^6$) には非効率である。

## 高速な方法: 階乗テーブル + フェルマーの小定理

### 核心アイデア

$p$ が素数のとき、フェルマーの小定理により

$$
a^{p-1} \equiv 1 \pmod{p} \quad (a \not\equiv 0)
$$

が成り立つ。したがって $a$ の逆元は $a^{p-2} \bmod p$ で計算できる。

$$
a^{-1} \equiv a^{p-2} \pmod{p}
$$

### アルゴリズム

1. **前処理**: 階乗テーブル $\text{fact}[0..n]$ を $O(n)$ で構築
2. **前処理**: 逆元テーブル $\text{inv\_fact}[0..n]$ を $O(n + \log p)$ で構築
3. **クエリ**: $\binom{n}{k} = \text{fact}[n] \cdot \text{inv\_fact}[k] \cdot \text{inv\_fact}[n-k] \bmod p$ を $O(1)$ で計算

### 逆元テーブルの効率的な構築

$n!$ の逆元だけフェルマーの小定理で計算し、残りは逆順に求める。

$$
(i!)^{-1} = ((i+1)!)^{-1} \cdot (i+1)
$$

これは $(i+1)! = (i+1) \cdot i!$ の両辺の逆元をとった式である。

### 実装

```python title="binomial_mod.py"
def modinv(a: int, mod: int) -> int:
    return pow(a, mod - 2, mod)

def precompute(n: int, mod: int):
    fact = [1] * (n + 1)
    for i in range(1, n + 1):
        fact[i] = fact[i - 1] * i % mod

    inv_fact = [1] * (n + 1)
    inv_fact[n] = modinv(fact[n], mod)
    for i in range(n - 1, -1, -1):
        inv_fact[i] = inv_fact[i + 1] * (i + 1) % mod

    return fact, inv_fact

def binom(n: int, k: int, fact, inv_fact, mod: int) -> int:
    if k < 0 or k > n:
        return 0
    return fact[n] * inv_fact[k] % mod * inv_fact[n - k] % mod
```

## 計算量

| 処理 | 時間計算量 |
|------|-----------|
| 前処理 | $O(n + \log p)$ |
| 各クエリ | $O(1)$ |
| 空間計算量 | $O(n)$ |

前処理のうち $O(n)$ は階乗テーブルの構築、$O(\log p)$ はフェルマーの小定理による逆元計算 (繰り返し二乗法) である。

## 正当性の証明

### 命題: 上記の方法で $\binom{n}{k} \bmod p$ が正しく計算される

**証明:**

$p$ は素数で $0 < k \leq n < p$ のとき、$k!$ と $(n-k)!$ は $p$ と互いに素である。したがってフェルマーの小定理により逆元が存在する。

$$
\binom{n}{k} = \frac{n!}{k!(n-k)!} \equiv n! \cdot (k!)^{-1} \cdot ((n-k)!)^{-1} \pmod{p}
$$

逆元テーブルの正当性は帰納法で示せる。$\text{inv\_fact}[n] = (n!)^{p-2}$ が基底ケースで、

$$
\text{inv\_fact}[i] = \text{inv\_fact}[i+1] \cdot (i+1) = ((i+1)!)^{-1} \cdot (i+1) = (i!)^{-1}
$$

が帰納ステップとなる。 $\square$

## 注意点

- $n \geq p$ の場合、$n!$ は $p$ の倍数を含むため逆元が存在しない。この場合は Lucas の定理を使う
- $p$ が素数でない場合は、素因数分解して中国剰余定理を組み合わせるなどの方法が必要

## 応用

- 組合せ数学全般の計算
- 確率の計算
- 包除原理との組み合わせ
- 二項級数の係数
- 動的計画法の遷移における組合せ係数

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n, k, p$ (素数) |
| 出力 | $\binom{n}{k} \bmod p$ |
| 前処理 | $O(n + \log p)$ |
| クエリ | $O(1)$ |
| 核心 | 階乗テーブル + フェルマーの小定理による逆元 |
