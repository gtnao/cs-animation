---
title: "FPS (形式的べき級数) 解説"
---

## 形式的べき級数とは

**形式的べき級数 (Formal Power Series, FPS)** とは、形式的な無限級数

$$
f(x) = \sum_{n=0}^{\infty} a_n x^n = a_0 + a_1 x + a_2 x^2 + \cdots
$$

のことである。「形式的」とは、$x$ に具体的な値を代入して収束性を考えるのではなく、あくまで係数列 $(a_0, a_1, a_2, \ldots)$ の代数的操作として扱うことを意味する。

実用上は mod $x^n$ で打ち切り、有限長の多項式として計算機上で処理する。

## 基本演算

### 加算・減算

$$
(f + g)_n = f_n + g_n, \quad (f - g)_n = f_n - g_n
$$

$O(n)$ で計算可能。

### 乗算 (畳み込み)

$$
(f \cdot g)_n = \sum_{k=0}^{n} f_k \cdot g_{n-k}
$$

素朴に計算すると $O(n^2)$ だが、NTT を用いれば $O(n \log n)$ で計算できる。

### 微分

$$
f'(x) = \sum_{n=0}^{\infty} (n+1) a_{n+1} x^n
$$

$O(n)$ で計算可能。

### 積分

$$
\int f(x) \, dx = \sum_{n=1}^{\infty} \frac{a_{n-1}}{n} x^n
$$

$O(n)$ で計算可能 (mod 素数の場合は逆元を用いる)。

### 逆元

$f_0 \neq 0$ のとき、$f(x) \cdot g(x) \equiv 1 \pmod{x^n}$ を満たす $g$ が一意に存在する。ニュートン法で $O(n \log n)$。

### 対数 (log)

$f_0 = 1$ のとき

$$
\log f(x) = \int \frac{f'(x)}{f(x)} dx
$$

$O(n \log n)$ (逆元 + 乗算 + 微積分)。

### 指数 (exp)

$f_0 = 0$ のとき

$$
\exp f(x) = \sum_{k=0}^{\infty} \frac{f(x)^k}{k!}
$$

ニュートン法で $O(n \log n)$。

### べき乗

$$
f(x)^k = \exp(k \cdot \log f(x))
$$

$O(n \log n)$。

### 平方根

$f_0 = 1$ のとき

$$
\sqrt{f(x)} = \exp\left(\frac{1}{2} \log f(x)\right)
$$

$O(n \log n)$。

## 演算の計算量まとめ

| 演算 | 計算量 | 前提条件 |
|------|--------|---------|
| 加算・減算 | $O(n)$ | なし |
| 乗算 | $O(n \log n)$ | なし |
| 微分・積分 | $O(n)$ | なし |
| 逆元 | $O(n \log n)$ | $f_0 \neq 0$ |
| $\log$ | $O(n \log n)$ | $f_0 = 1$ |
| $\exp$ | $O(n \log n)$ | $f_0 = 0$ |
| べき乗 | $O(n \log n)$ | $f_0 = 1$ |
| 平方根 | $O(n \log n)$ | $f_0 = 1$, 平方根存在 |
| 除算 | $O(n \log n)$ | 除数の定数項非零 |
| 合成 | $O(n^2)$ or 特殊ケース | 一般には高速化困難 |
| 合成逆 | $O(n \log n)$ or $O(n^2)$ | $f_0 = 0$, $f_1 \neq 0$ |

## 応用例

### 母関数による数え上げ

組合せ論の問題では、数列 $(a_n)$ の母関数 $f(x) = \sum a_n x^n$ を FPS として操作する。

**例: 分割数**

分割数 $p(n)$ の母関数は

$$
\sum_{n=0}^{\infty} p(n) x^n = \prod_{k=1}^{\infty} \frac{1}{1 - x^k}
$$

右辺を FPS として計算すれば $p(n)$ が求まる。$\prod_{k=1}^{n} (1-x^k)$ を求めてその逆元を取ればよい。

### 木の数え上げ

ラベルなし根付き木の個数を求める際に $\exp$ が登場する。

### 多項式補間

ラグランジュ補間を FPS の演算で効率化できる。

## 実装テンプレート

```python title="fps.py"
class FPS:
    def __init__(self, coeffs, mod):
        self.a = list(coeffs)
        self.mod = mod

    def __add__(self, other):
        n = max(len(self.a), len(other.a))
        c = [0] * n
        for i in range(n):
            c[i] = ((self.a[i] if i < len(self.a) else 0)
                   + (other.a[i] if i < len(other.a) else 0)) % self.mod
        return FPS(c, self.mod)

    def __sub__(self, other):
        n = max(len(self.a), len(other.a))
        c = [0] * n
        for i in range(n):
            c[i] = ((self.a[i] if i < len(self.a) else 0)
                   - (other.a[i] if i < len(other.a) else 0)) % self.mod
        return FPS(c, self.mod)

    def __mul__(self, other):
        c = ntt_mul(self.a, other.a)
        return FPS(c, self.mod)

    def derivative(self):
        n = len(self.a)
        if n <= 1:
            return FPS([0], self.mod)
        c = [(i + 1) * self.a[i + 1] % self.mod for i in range(n - 1)]
        return FPS(c, self.mod)

    def integral(self):
        n = len(self.a)
        c = [0] * (n + 1)
        for i in range(n):
            c[i + 1] = self.a[i] * pow(i + 1, self.mod - 2, self.mod) % self.mod
        return FPS(c, self.mod)
```

## まとめ

| 項目 | 内容 |
|------|------|
| 対象 | 形式的べき級数 (係数列) |
| 基本演算 | 加減乗除、微積分、log、exp 等 |
| 多くの演算の計算量 | $O(n \log n)$ |
| 核心技術 | NTT (高速畳み込み) + ニュートン法 |
| 主要応用 | 母関数、数え上げ、多項式操作 |
