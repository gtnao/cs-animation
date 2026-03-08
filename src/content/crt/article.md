---
title: "中国剰余定理 (CRT) 解説"
---

## 中国剰余定理とは

中国剰余定理 (Chinese Remainder Theorem, CRT) は、互いに素な法を持つ連立合同式の解の存在と一意性を保証する定理である。

古代中国の数学書『孫子算経』に登場する問題がその名の由来とされている。

## 定理

### 中国剰余定理 (互いに素な場合)

$m_1, m_2, \ldots, m_k$ が互いに素 (pairwise coprime) であるとき、次の連立合同式:

$$
\begin{cases}
x \equiv r_1 \pmod{m_1} \\
x \equiv r_2 \pmod{m_2} \\
\vdots \\
x \equiv r_k \pmod{m_k}
\end{cases}
$$

は $M = m_1 m_2 \cdots m_k$ を法として一意な解を持つ。

### 構成的証明

$M_i = M / m_i$ とおく。$\gcd(M_i, m_i) = 1$ なので、拡張ユークリッドの互除法により $M_i t_i \equiv 1 \pmod{m_i}$ を満たす $t_i$ が存在する。

$$
x = \sum_{i=1}^{k} r_i M_i t_i
$$

とおくと、$j \neq i$ のとき $m_i \mid M_j$ なので $M_j t_j \equiv 0 \pmod{m_i}$。一方 $M_i t_i \equiv 1 \pmod{m_i}$ なので:

$$
x \equiv r_i \cdot 1 + \sum_{j \neq i} r_j \cdot 0 = r_i \pmod{m_i}
$$

**一意性:** $x_1, x_2$ がともに解なら、全ての $i$ について $m_i \mid (x_1 - x_2)$。$m_i$ が互いに素なので $M \mid (x_1 - x_2)$。つまり $x_1 \equiv x_2 \pmod{M}$。 $\square$

## 一般の場合 (互いに素でなくても良い)

### 2つの合同式の統合

$$
x \equiv r_1 \pmod{m_1}, \quad x \equiv r_2 \pmod{m_2}
$$

$g = \gcd(m_1, m_2)$ とする。$(r_2 - r_1)$ が $g$ で割り切れなければ解なし。

割り切れる場合、拡張ユークリッドの互除法で $m_1 p + m_2 q = g$ を満たす $p, q$ を求め:

$$
x \equiv r_1 + m_1 \cdot p \cdot \frac{r_2 - r_1}{g} \pmod{\text{lcm}(m_1, m_2)}
$$

この手順を繰り返し適用して $k$ 個の合同式を逐次統合できる。

### 具体例

$$
\begin{cases}
x \equiv 2 \pmod{3} \\
x \equiv 3 \pmod{5} \\
x \equiv 2 \pmod{7}
\end{cases}
$$

**ステップ1:** $x \equiv 2 \pmod{3}$ と $x \equiv 3 \pmod{5}$ を統合。

$\gcd(3, 5) = 1$。$3p + 5q = 1$ より $p = 2, q = -1$。

$x \equiv 2 + 3 \cdot 2 \cdot (3 - 2) = 8 \pmod{15}$

**ステップ2:** $x \equiv 8 \pmod{15}$ と $x \equiv 2 \pmod{7}$ を統合。

$\gcd(15, 7) = 1$。$15p + 7q = 1$ より $p = 1, q = -2$。

$x \equiv 8 + 15 \cdot 1 \cdot (2 - 8) = 8 - 90 \equiv 23 \pmod{105}$

検証: $23 = 7 \cdot 3 + 2 \equiv 2 \pmod{3}$、$23 = 4 \cdot 5 + 3 \equiv 3 \pmod{5}$、$23 = 3 \cdot 7 + 2 \equiv 2 \pmod{7}$。 ✓

## 実装

### 逐次統合法

```python title="crt.py"
def ext_gcd(a: int, b: int) -> tuple[int, int, int]:
    if b == 0:
        return a, 1, 0
    g, x, y = ext_gcd(b, a % b)
    return g, y, x - (a // b) * y

def crt(remainders: list[int], moduli: list[int]) -> tuple[int, int] | None:
    """Returns (r, m) such that x ≡ r (mod m), or None if no solution."""
    r, m = remainders[0] % moduli[0], moduli[0]
    for i in range(1, len(remainders)):
        r2 = remainders[i] % moduli[i]
        m2 = moduli[i]
        g, p, _ = ext_gcd(m, m2)
        if (r2 - r) % g != 0:
            return None
        lcm = m // g * m2
        r = (r + m * (p * ((r2 - r) // g) % (m2 // g))) % lcm
        m = lcm
    return r, m
```

### C++ 実装

```cpp title="crt.cpp"
pair<long long, long long> crt(vector<long long>& r, vector<long long>& m) {
    long long R = r[0], M = m[0];
    for (int i = 1; i < (int)r.size(); i++) {
        auto [g, p, q] = ext_gcd(M, m[i]);
        if ((r[i] - R) % g != 0) return {-1, -1};
        long long lcm = M / g * m[i];
        R = (R + M % lcm * (p % (m[i] / g)) % lcm * ((r[i] - R) / g) % lcm) % lcm;
        if (R < 0) R += lcm;
        M = lcm;
    }
    return {R, M};
}
```

## 計算量

$k$ 個の合同式に対して、各統合で拡張ユークリッドの互除法を 1 回行う。全体の計算量は $O(k \log(\max m_i))$。

## 応用

- **Garner のアルゴリズム**: 大きな数の多倍長演算を避けるための CRT の変形
- **RSA 暗号の高速化**: CRT を用いて復号を高速化 (CRT-RSA)
- **競技プログラミング**: 複数の素数で mod を取った結果から元の値を復元

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 連立合同式 $x \equiv r_i \pmod{m_i}$ ($i = 1, \ldots, k$) |
| 出力 | 統合された合同式 $x \equiv r \pmod{M}$ |
| 時間計算量 | $O(k \log(\max m_i))$ |
| 核心 | 拡張ユークリッドの互除法による逐次統合 |
| 応用 | Garner のアルゴリズム、RSA 高速化 |
