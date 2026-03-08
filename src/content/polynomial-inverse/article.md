---
title: "多項式の逆元・除算 解説"
---

## 多項式の逆元とは

形式的べき級数 $f(x) = f_0 + f_1 x + f_2 x^2 + \cdots$ に対して、

$$
f(x) \cdot g(x) \equiv 1 \pmod{x^n}
$$

を満たす $g(x)$ を $f(x)$ の **逆元** (mod $x^n$) と呼ぶ。$f_0 \neq 0$ のとき逆元は一意に存在する。

### 前提条件

$f_0 \neq 0$ (定数項が非零) であること。$f_0 = 0$ の場合、逆元は存在しない。

## 素朴なアプローチ

$g$ の各係数を順に求めることができる。$f \cdot g \equiv 1 \pmod{x^n}$ を展開すると

$$
g_0 = f_0^{-1}
$$

$$
g_k = -f_0^{-1} \sum_{j=1}^{k} f_j g_{k-j}
$$

この方法は $O(n^2)$ である。

```python title="poly_inv_naive.py"
def poly_inv_naive(f, n, mod):
    g = [0] * n
    g[0] = pow(f[0], mod - 2, mod)
    for k in range(1, n):
        s = 0
        for j in range(1, k + 1):
            if j < len(f):
                s += f[j] * g[k - j] % mod
        g[k] = (-g[0] * s) % mod
    return g
```

## ニュートン法による高速化

### 核心アイデア

精度 $k$ の近似解から精度 $2k$ の近似解を 1 ステップで求める。これにより $O(n \log n)$ で逆元が求まる。

### 導出

$F(g) = 1/g - f$ とおく。$F(g) = 0$ の解が $g = 1/f$ である。

ニュートン法の更新式:

$$
g_{k+1} = g_k - \frac{F(g_k)}{F'(g_k)} = g_k - \frac{1/g_k - f}{-1/g_k^2} = 2g_k - g_k^2 f
$$

**定理:** $g_k \equiv 1/f \pmod{x^{2^k}}$ ならば $g_{k+1} \equiv 1/f \pmod{x^{2^{k+1}}}$。

**証明:**

$f \cdot g_k \equiv 1 \pmod{x^{2^k}}$ が成り立つと仮定する。すなわち $f \cdot g_k = 1 + h$ で $h \equiv 0 \pmod{x^{2^k}}$ である。

$$
f \cdot g_{k+1} = f(2g_k - g_k^2 f) = 2fg_k - f g_k^2 f = 2(1+h) - (1+h)^2 = 1 - h^2
$$

$h \equiv 0 \pmod{x^{2^k}}$ なので $h^2 \equiv 0 \pmod{x^{2^{k+1}}}$。

したがって $f \cdot g_{k+1} \equiv 1 \pmod{x^{2^{k+1}}}$。 $\square$

### アルゴリズムの流れ

1. $g_0 = f_0^{-1}$ (精度 1)
2. 反復: $g_{k+1} = 2g_k - g_k^2 \cdot f \pmod{x^{2^{k+1}}}$
3. $\lceil \log_2 n \rceil$ 回の反復で精度 $n$ に到達

### 実装

```python title="poly_inv.py"
def poly_inv(f, n, mod):
    """f(x) の逆元を mod x^n で求める"""
    g = [pow(f[0], mod - 2, mod)]
    prec = 1

    while prec < n:
        new_prec = min(prec * 2, n)
        f_trunc = f[:new_prec] + [0] * (new_prec - min(len(f), new_prec))

        # g = 2*g - g^2 * f  (mod x^new_prec)
        # NTT を用いて計算
        g_sq = ntt_mul(g, g, new_prec)
        g_sq_f = ntt_mul(g_sq, f_trunc, new_prec)

        new_g = [0] * new_prec
        for i in range(new_prec):
            gi = g[i] if i < len(g) else 0
            new_g[i] = (2 * gi - g_sq_f[i]) % mod

        g = new_g
        prec = new_prec

    return g[:n]
```

## 計算量

各反復で NTT 畳み込み ($O(n \log n)$) を行う。精度が倍々に増えるので

$$
T(n) = T(n/2) + O(n \log n) = O(n \log n)
$$

より正確には、各ステップの計算量は精度に比例するので

$$
T(n) = O(n \log n) + O(n/2 \cdot \log(n/2)) + \cdots = O(n \log n)
$$

(等比級数の和が $O(n \log n)$ に収まる)

## 多項式除算

$A(x) = B(x) \cdot Q(x) + R(x)$ ($\deg R < \deg B$) の商 $Q$ と余り $R$ を求めるには、逆元を利用できる。

$\deg A = n$, $\deg B = m$ とする。$x$ を $1/x$ で置き換えて反転すると

$$
A^{rev}(x) = B^{rev}(x) \cdot Q^{rev}(x) + x^{n-m+1} R^{rev}(x)
$$

$\pmod{x^{n-m+1}}$ を取れば $Q^{rev}$ が求まる。

$$
Q^{rev}(x) \equiv A^{rev}(x) \cdot (B^{rev}(x))^{-1} \pmod{x^{n-m+1}}
$$

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 多項式 $f(x)$, 精度 $n$ |
| 出力 | $f(x)^{-1} \mod x^n$ |
| 時間計算量 | $O(n \log n)$ |
| 空間計算量 | $O(n)$ |
| 核心 | ニュートン法で精度を倍々に向上 |
| 前提 | $f_0 \neq 0$ |
