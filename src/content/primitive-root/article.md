---
title: "原始根 解説"
---

## 原始根とは

素数 $p$ に対して、$g^1, g^2, \ldots, g^{p-1}$ が $\{1, 2, \ldots, p-1\}$ の全ての要素を法 $p$ で生成するとき、$g$ を $p$ の**原始根** (primitive root) と呼ぶ。

### 定義

$\text{ord}_p(g)$ ($g$ の $p$ を法とする位数) を $g^k \equiv 1 \pmod{p}$ を満たす最小の正整数 $k$ とする。

$$
g \text{ が } p \text{ の原始根} \iff \text{ord}_p(g) = p - 1
$$

### 具体例

$p = 7$ の場合:

| $k$ | $2^k \bmod 7$ | $3^k \bmod 7$ |
|-----|----------------|----------------|
| 1 | 2 | 3 |
| 2 | 4 | 2 |
| 3 | 1 | 6 |
| 4 | 2 | 4 |
| 5 | 4 | 5 |
| 6 | 1 | 1 |

$\text{ord}_7(2) = 3 \neq 6$ なので $2$ は原始根でない。$\text{ord}_7(3) = 6 = p-1$ なので $3$ は原始根。

## 存在定理

### 定理: 全ての素数は原始根を持つ

**証明の概略:** $(\mathbb{Z}/p\mathbb{Z})^\times$ は位数 $p-1$ の巡回群である。これは $x^d \equiv 1 \pmod{p}$ の解が高々 $d$ 個であることから、位数 $d$ の元の個数を数え上げることで示される。巡回群の生成元が原始根に対応する。 $\square$

### 原始根の個数

素数 $p$ の原始根の個数は $\varphi(p-1)$ 個。原始根 $g$ が一つ見つかれば、$g^k$ ($\gcd(k, p-1) = 1$) が全ての原始根を与える。

## 原始根の求め方

### アルゴリズム

$g$ が原始根であるための必要十分条件:

$$
g^{(p-1)/q} \not\equiv 1 \pmod{p} \quad \text{for all prime } q \mid (p-1)
$$

**なぜこれで十分か:** $\text{ord}_p(g) \mid (p-1)$ (ラグランジュの定理)。$\text{ord}_p(g) < p-1$ なら、ある素因数 $q$ に対して $\text{ord}_p(g) \mid (p-1)/q$ となり、$g^{(p-1)/q} \equiv 1 \pmod{p}$ となる。対偶をとれば上の条件が十分条件。

### 手順

1. $p - 1$ を素因数分解: $p - 1 = q_1^{e_1} q_2^{e_2} \cdots q_k^{e_k}$
2. $g = 2, 3, \ldots$ を順に試す
3. 各 $g$ について、全ての素因数 $q_i$ に対して $g^{(p-1)/q_i} \bmod p \neq 1$ をチェック
4. 全てパスすれば $g$ が原始根

### 計算量

最小の原始根は一般に非常に小さい (素数 $p$ に対して $O(p^\epsilon)$ と予想されている)。各候補のテストは素因数の個数 $\times$ 繰り返し二乗法で $O(k \log p)$。実用上は非常に高速。

## 実装

```python title="primitive_root.py"
def primitive_root(p: int) -> int:
    if p == 2:
        return 1
    phi = p - 1
    # Factorize phi
    factors = []
    n = phi
    d = 2
    while d * d <= n:
        if n % d == 0:
            factors.append(d)
            while n % d == 0:
                n //= d
        d += 1
    if n > 1:
        factors.append(n)
    # Test candidates
    for g in range(2, p):
        if all(pow(g, phi // q, p) != 1 for q in factors):
            return g
    return -1
```

```cpp title="primitive_root.cpp"
long long primitive_root(long long p) {
    long long phi = p - 1;
    vector<long long> factors;
    long long n = phi;
    for (long long d = 2; d * d <= n; d++) {
        if (n % d == 0) {
            factors.push_back(d);
            while (n % d == 0) n /= d;
        }
    }
    if (n > 1) factors.push_back(n);
    for (long long g = 2; g < p; g++) {
        bool ok = true;
        for (long long q : factors) {
            if (power(g, phi / q, p) == 1) {
                ok = false;
                break;
            }
        }
        if (ok) return g;
    }
    return -1;
}
```

## 応用

### NTT (Number Theoretic Transform)

NTT では、法 $p$ における原始 $n$ 乗根が必要。原始根 $g$ に対して $g^{(p-1)/n}$ が原始 $n$ 乗根となる ($n \mid (p-1)$ の場合)。

よく使われる NTT 素数:
- $998244353 = 119 \times 2^{23} + 1$, 原始根 $g = 3$
- $469762049 = 7 \times 2^{26} + 1$, 原始根 $g = 3$

### 離散対数

原始根を用いると、$(\mathbb{Z}/p\mathbb{Z})^\times$ の全ての元を $g^k$ の形で表現できる。これにより乗法を加法に変換でき、離散対数の問題設定が明確になる。

### 指標 (Character)

原始根は群の指標 (character) の構成にも用いられる。

## 一般化

原始根は素数だけでなく、$n = 1, 2, 4, p^k, 2p^k$ ($p$ は奇素数) の場合にも存在する。これ以外の $n$ に対しては原始根は存在しない。

## まとめ

| 項目 | 内容 |
|------|------|
| 定義 | $\text{ord}_p(g) = p - 1$ となる $g$ |
| 存在 | 全ての素数 $p$ に対して存在 |
| 個数 | $\varphi(p-1)$ 個 |
| 判定 | 全素因数 $q \mid (p-1)$ に対して $g^{(p-1)/q} \not\equiv 1$ |
| 応用 | NTT、離散対数、暗号 |
