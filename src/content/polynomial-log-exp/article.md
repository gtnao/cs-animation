---
title: "多項式の対数・指数 解説"
---

## 概要

形式的べき級数 (FPS) に対する $\log$ と $\exp$ は、多くの高度なアルゴリズムの基盤となる演算である。いずれもニュートン法を応用して $O(n \log n)$ で計算できる。

## 多項式の対数 (log)

### 定義

$f(x)$ が $f_0 = 1$ を満たす形式的べき級数であるとき、

$$
\log f(x) = \int \frac{f'(x)}{f(x)} dx
$$

と定義する。

### 直感的理解

実数の場合 $(\log f)' = f'/f$ が成り立つ。形式的べき級数でも同様の関係を利用する。

### アルゴリズム

1. $f'(x)$ を計算する (微分: $O(n)$)
2. $f(x)^{-1}$ を計算する (逆元: $O(n \log n)$)
3. $f'(x) \cdot f(x)^{-1}$ を計算する (乗算: $O(n \log n)$)
4. 積分する ($O(n)$)

### 実装

```python title="poly_log.py"
def poly_log(f, n, mod):
    """log(f(x)) mod x^n を求める。f[0] = 1 が必要。"""
    # f'(x)
    f_prime = [(i + 1) * f[i + 1] % mod for i in range(n - 1)]

    # 1/f(x)
    f_inv = poly_inv(f, n, mod)

    # f'(x) / f(x)
    quotient = ntt_mul(f_prime, f_inv, n)

    # integrate
    result = [0] * n
    for i in range(1, n):
        result[i] = quotient[i - 1] * pow(i, mod - 2, mod) % mod

    return result
```

### 計算量

$O(n \log n)$ (逆元と乗算がボトルネック)

## 多項式の指数 (exp)

### 定義

$f(x)$ が $f_0 = 0$ を満たす形式的べき級数であるとき、

$$
\exp(f(x)) = \sum_{k=0}^{\infty} \frac{f(x)^k}{k!}
$$

この級数は $f_0 = 0$ のとき形式的に収束する (各係数が有限個の項の和で確定する)。

### ニュートン法による計算

$g(x) = \exp(f(x))$ を求めたい。$\log(g(x)) = f(x)$ なので、$\Phi(g) = \log(g) - f = 0$ の解を求める問題になる。

ニュートン法の更新式:

$$
g_{k+1} = g_k - \frac{\Phi(g_k)}{\Phi'(g_k)} = g_k - \frac{\log(g_k) - f}{1/g_k} = g_k(1 - \log(g_k) + f)
$$

### 収束性

$g_k \equiv \exp(f) \pmod{x^{2^k}}$ ならば $g_{k+1} \equiv \exp(f) \pmod{x^{2^{k+1}}}$。

**証明の概略:** ニュートン法の 2 次収束性より、誤差が 2 乗で減少する。

### 実装

```python title="poly_exp.py"
def poly_exp(f, n, mod):
    """exp(f(x)) mod x^n を求める。f[0] = 0 が必要。"""
    g = [1]  # initial: exp(0) = 1
    prec = 1

    while prec < n:
        new_prec = min(prec * 2, n)

        # g = g * (1 - log(g) + f)  mod x^new_prec
        g_padded = g + [0] * (new_prec - len(g))
        log_g = poly_log(g_padded, new_prec, mod)

        diff = [0] * new_prec
        diff[0] = 1
        for i in range(new_prec):
            diff[i] = (diff[i] - log_g[i] + (f[i] if i < len(f) else 0)) % mod

        g = ntt_mul(g_padded, diff, new_prec)[:new_prec]
        prec = new_prec

    return g[:n]
```

### 計算量

各反復で $\log$ ($O(n \log n)$) と乗算 ($O(n \log n)$) を行う。精度が倍々に増えるので

$$
T(n) = T(n/2) + O(n \log n) = O(n \log n)
$$

## log と exp の関係

| 演算 | 前提条件 | 定義 | 計算量 |
|------|---------|------|--------|
| $\log f$ | $f_0 = 1$ | $\int f'/f \, dx$ | $O(n \log n)$ |
| $\exp f$ | $f_0 = 0$ | Newton法 | $O(n \log n)$ |

$\exp(\log(f)) = f$ および $\log(\exp(f)) = f$ が (適切な条件下で) 成り立つ。

## 応用

### べき乗

$f(x)^k$ を求めるには

$$
f(x)^k = \exp(k \cdot \log(f(x)))
$$

とすればよい。$\log$ と $\exp$ がそれぞれ $O(n \log n)$ なので全体で $O(n \log n)$。

### 合成逆

$f(g(x)) = x$ を満たす $g(x)$ (合成逆) を求めるアルゴリズムの基盤にもなる。

### 数え上げ

木の数え上げや、指数型母関数の操作など、組合せ論の問題でも $\log$ と $\exp$ は頻出する。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 形式的べき級数 $f(x)$, 精度 $n$ |
| 出力 | $\log f(x)$ または $\exp f(x)$ mod $x^n$ |
| 時間計算量 | $O(n \log n)$ |
| 空間計算量 | $O(n)$ |
| 核心 | 微分積分 + 逆元 (log), ニュートン法 (exp) |
| 前提 | $f_0 = 1$ (log), $f_0 = 0$ (exp) |
