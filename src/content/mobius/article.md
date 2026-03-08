---
title: "メビウス関数・メビウスの反転公式 解説"
---

## メビウス関数とは

メビウス関数 (Mobius function) $\mu(n)$ は整数論における重要な乗法的関数 (multiplicative function) である。

### 定義

$$
\mu(n) = \begin{cases}
1 & n = 1 \\
(-1)^k & n = p_1 p_2 \cdots p_k \text{ (相異なる素数の積)} \\
0 & n \text{ が平方因子を持つ}
\end{cases}
$$

つまり:
- $\mu(1) = 1$
- $n$ が平方因子を持つ (ある素数 $p$ で $p^2 \mid n$) なら $\mu(n) = 0$
- $n$ が $k$ 個の相異なる素数の積なら $\mu(n) = (-1)^k$

### 具体例

| $n$ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|-----|---|---|---|---|---|---|---|---|---|-----|
| $\mu(n)$ | 1 | -1 | -1 | 0 | -1 | 1 | -1 | 0 | 0 | 1 |

- $\mu(6) = \mu(2 \cdot 3) = (-1)^2 = 1$
- $\mu(4) = \mu(2^2) = 0$ (平方因子 $2^2$)
- $\mu(10) = \mu(2 \cdot 5) = (-1)^2 = 1$

## メビウス関数の基本性質

### 性質1: 乗法性

$\gcd(a, b) = 1$ のとき $\mu(ab) = \mu(a)\mu(b)$

### 性質2: 約数和

$$
\sum_{d \mid n} \mu(d) = [n = 1] = \begin{cases} 1 & n = 1 \\ 0 & n > 1 \end{cases}
$$

**証明:** $n = 1$ の場合は明らか。$n > 1$ のとき $n = p_1^{e_1} p_2^{e_2} \cdots p_k^{e_k}$ とする。$\mu(d) \neq 0$ となる約数 $d$ は $p_1, \ldots, p_k$ の部分集合の積のみ。$k$ 個の素数から $j$ 個選ぶ組合せは $\binom{k}{j}$ 通りで、各々の $\mu$ 値は $(-1)^j$。よって:

$$
\sum_{d \mid n} \mu(d) = \sum_{j=0}^{k} \binom{k}{j}(-1)^j = (1 - 1)^k = 0 \quad \square
$$

## メビウスの反転公式

### 定理

整数論的関数 $f, g$ に対して:

$$
g(n) = \sum_{d \mid n} f(d) \quad \Longleftrightarrow \quad f(n) = \sum_{d \mid n} \mu(d) \, g\!\left(\frac{n}{d}\right)
$$

**証明 ($\Rightarrow$):**

$$
\sum_{d \mid n} \mu(d)\, g\!\left(\frac{n}{d}\right) = \sum_{d \mid n} \mu(d) \sum_{e \mid (n/d)} f(e) = \sum_{e \mid n} f(e) \sum_{d \mid (n/e)} \mu(d)
$$

性質2より $\sum_{d \mid (n/e)} \mu(d) = [n/e = 1] = [e = n]$。よって右辺 $= f(n)$。 $\square$

### 和の形での反転公式

$$
g(n) = \sum_{d=1}^{n} f\!\left(\left\lfloor \frac{n}{d} \right\rfloor\right) \quad \Longleftrightarrow \quad f(n) = \sum_{d=1}^{n} \mu(d)\, g\!\left(\left\lfloor \frac{n}{d} \right\rfloor\right)
$$

## 篩によるメビウス関数の計算

線形篩を拡張して $\mu$ を $O(N)$ で計算できる。

```python title="mobius_sieve.py"
def mobius_sieve(n: int) -> list[int]:
    mu = [0] * (n + 1)
    mu[1] = 1
    primes = []
    lpf = [0] * (n + 1)
    for i in range(2, n + 1):
        if lpf[i] == 0:
            lpf[i] = i
            primes.append(i)
            mu[i] = -1
        for p in primes:
            if p > lpf[i] or i * p > n:
                break
            lpf[i * p] = p
            if i % p == 0:
                mu[i * p] = 0
            else:
                mu[i * p] = -mu[i]
    return mu
```

```cpp title="mobius_sieve.cpp"
int mu[MAXN + 1];
int lpf[MAXN + 1];
vector<int> primes;

void mobius_sieve(int n) {
    mu[1] = 1;
    for (int i = 2; i <= n; i++) {
        if (lpf[i] == 0) {
            lpf[i] = i;
            primes.push_back(i);
            mu[i] = -1;
        }
        for (int p : primes) {
            if (p > lpf[i] || (long long)i * p > n) break;
            lpf[i * p] = p;
            if (i % p == 0) {
                mu[i * p] = 0;
            } else {
                mu[i * p] = -mu[i];
            }
        }
    }
}
```

## 応用

### 互いに素な対の数え上げ

$1 \leq a, b \leq N$ で $\gcd(a, b) = 1$ となる対の数:

$$
\sum_{a=1}^{N} \sum_{b=1}^{N} [\gcd(a,b)=1] = \sum_{d=1}^{N} \mu(d) \left\lfloor \frac{N}{d} \right\rfloor^2
$$

### 包除原理との関係

メビウスの反転公式は包除原理の一般化と見なせる。$\mu$ 関数が $+1, -1$ の交代を与え、重複を打ち消す役割を果たす。

## まとめ

| 項目 | 内容 |
|------|------|
| 定義 | $\mu(n)$: 平方因子なし $\to (-1)^k$、平方因子あり $\to 0$ |
| 基本性質 | $\sum_{d \mid n} \mu(d) = [n=1]$ |
| 反転公式 | $g = f * 1 \Leftrightarrow f = g * \mu$ |
| 計算量 | 線形篩で $O(N)$ |
| 応用 | 包除原理、互いに素な対の数え上げ |
