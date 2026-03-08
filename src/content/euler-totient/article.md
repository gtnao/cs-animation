---
title: "オイラーのφ関数 解説"
---

## オイラーのφ関数とは

オイラーのφ関数 (Euler's totient function) $\varphi(n)$ は、$1$ 以上 $n$ 以下の整数のうち $n$ と互いに素なものの個数を表す関数である。

$$
\varphi(n) = \#\{\ k \mid 1 \leq k \leq n,\ \gcd(k, n) = 1\ \}
$$

### 具体例

| $n$ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|-----|---|---|---|---|---|---|---|---|---|----|----|-----|
| $\varphi(n)$ | 1 | 1 | 2 | 2 | 4 | 2 | 6 | 4 | 6 | 4 | 10 | 4 |

例えば $\varphi(12) = 4$ で、12 と互いに素な数は $1, 5, 7, 11$ の 4 つ。

## 公式

### 素数べき

$$
\varphi(p^k) = p^k - p^{k-1} = p^{k-1}(p - 1)
$$

$1$ から $p^k$ のうち $p$ の倍数は $p^{k-1}$ 個なので、互いに素な数は $p^k - p^{k-1}$ 個。

### 一般の場合

$n = p_1^{e_1} p_2^{e_2} \cdots p_k^{e_k}$ のとき:

$$
\varphi(n) = n \prod_{p \mid n} \left(1 - \frac{1}{p}\right) = n \cdot \frac{p_1 - 1}{p_1} \cdot \frac{p_2 - 1}{p_2} \cdots \frac{p_k - 1}{p_k}
$$

この公式は乗法性と素数べきの場合から直ちに従う。

## 基本性質

### 乗法性

$\gcd(a, b) = 1$ のとき $\varphi(ab) = \varphi(a)\varphi(b)$

**証明:** 中国剰余定理より $\mathbb{Z}/ab\mathbb{Z} \cong \mathbb{Z}/a\mathbb{Z} \times \mathbb{Z}/b\mathbb{Z}$。単元群も同型なので $(\mathbb{Z}/ab\mathbb{Z})^\times \cong (\mathbb{Z}/a\mathbb{Z})^\times \times (\mathbb{Z}/b\mathbb{Z})^\times$。位数を比較して $\varphi(ab) = \varphi(a)\varphi(b)$。 $\square$

### 約数和公式

$$
\sum_{d \mid n} \varphi(d) = n
$$

**証明:** $1, 2, \ldots, n$ を $\gcd(k, n) = d$ ごとにグループ分けする。$\gcd(k, n) = d$ となる $k$ は $k = dm$ ($1 \leq m \leq n/d$, $\gcd(m, n/d) = 1$) なので $\varphi(n/d)$ 個。よって:

$$
\sum_{d \mid n} \varphi(n/d) = n
$$

$d$ が $n$ の約数を走るとき $n/d$ も約数を走るので、$\sum_{d \mid n} \varphi(d) = n$。 $\square$

### オイラーの定理

$\gcd(a, n) = 1$ のとき:

$$
a^{\varphi(n)} \equiv 1 \pmod{n}
$$

フェルマーの小定理 ($n$ が素数 $p$ のとき $a^{p-1} \equiv 1 \pmod{p}$) の一般化。

## 計算法

### 単一の値の計算

素因数分解を用いて $O(\sqrt{n})$ で計算できる。

```python title="euler_totient.py"
def euler_totient(n: int) -> int:
    result = n
    d = 2
    while d * d <= n:
        if n % d == 0:
            while n % d == 0:
                n //= d
            result -= result // d
        d += 1
    if n > 1:
        result -= result // n
    return result
```

### 篩による一括計算

線形篩を拡張して $\varphi(1), \ldots, \varphi(N)$ を $O(N)$ で一括計算できる。

```python title="euler_totient_sieve.py"
def totient_sieve(n: int) -> list[int]:
    phi = list(range(n + 1))  # phi[i] = i
    primes = []
    lpf = [0] * (n + 1)
    for i in range(2, n + 1):
        if lpf[i] == 0:
            lpf[i] = i
            primes.append(i)
            phi[i] = i - 1
        for p in primes:
            if p > lpf[i] or i * p > n:
                break
            lpf[i * p] = p
            if i % p == 0:
                phi[i * p] = phi[i] * p
            else:
                phi[i * p] = phi[i] * (p - 1)
    return phi
```

```cpp title="euler_totient_sieve.cpp"
int phi[MAXN + 1];
int lpf[MAXN + 1];
vector<int> primes;

void totient_sieve(int n) {
    iota(phi, phi + n + 1, 0);
    for (int i = 2; i <= n; i++) {
        if (lpf[i] == 0) {
            lpf[i] = i;
            primes.push_back(i);
            phi[i] = i - 1;
        }
        for (int p : primes) {
            if (p > lpf[i] || (long long)i * p > n) break;
            lpf[i * p] = p;
            if (i % p == 0) {
                phi[i * p] = phi[i] * p;
            } else {
                phi[i * p] = phi[i] * (p - 1);
            }
        }
    }
}
```

## 応用

### モジュラ逆元

$\gcd(a, p) = 1$ のとき、$a^{-1} \equiv a^{\varphi(p) - 1} \pmod{p}$。

特に $p$ が素数なら $a^{-1} \equiv a^{p-2} \pmod{p}$ (フェルマーの小定理)。

### RSA 暗号

RSA 暗号では $n = pq$ ($p, q$ は大きな素数) に対して $\varphi(n) = (p-1)(q-1)$ を用いて秘密鍵を構成する。

## まとめ

| 項目 | 内容 |
|------|------|
| 定義 | $\varphi(n) = \#\{k : 1 \leq k \leq n, \gcd(k,n)=1\}$ |
| 公式 | $\varphi(n) = n \prod_{p \mid n}(1 - 1/p)$ |
| 単一計算 | $O(\sqrt{n})$ |
| 篩 | $O(N)$ |
| 応用 | オイラーの定理、モジュラ逆元、RSA |
