---
title: "拡張ユークリッドの互除法 解説"
---

## 拡張ユークリッドの互除法とは

拡張ユークリッドの互除法 (Extended Euclidean Algorithm) は、2つの整数 $a, b$ に対して最大公約数 $\gcd(a, b)$ を求めるとともに、次の**ベズーの等式 (Bezout's identity)** を満たす整数 $x, y$ を求めるアルゴリズムである。

$$
ax + by = \gcd(a, b)
$$

## ベズーの等式

### 定理 (Bezout's identity)

任意の整数 $a, b$ (少なくとも一方は 0 でない) に対して、$ax + by = \gcd(a, b)$ を満たす整数 $x, y$ が存在する。

**証明:** 集合 $S = \{\ ax + by \mid x, y \in \mathbb{Z},\ ax + by > 0\ \}$ を考える。$S$ は非空 ($|a| + |b| \in S$) なので、最小元 $d$ が存在する。

$d = ax_0 + by_0$ とする。$a$ を $d$ で割ると $a = dq + r$ ($0 \leq r < d$)。ここで:

$$
r = a - dq = a - (ax_0 + by_0)q = a(1 - x_0 q) + b(-y_0 q)
$$

$r \in S \cup \{0\}$ だが、$r < d$ かつ $d$ は $S$ の最小元なので $r = 0$。よって $d \mid a$。同様に $d \mid b$。

$d$ は $a, b$ の公約数である。一方、$a, b$ の任意の公約数 $c$ に対して $c \mid (ax_0 + by_0) = d$ なので $c \leq d$。したがって $d = \gcd(a, b)$。 $\square$

## アルゴリズム

### 基本的なアイデア

ユークリッドの互除法の各ステップで $\gcd(a, b) = \gcd(b, a \bmod b)$ と変換する。この再帰の基底ケースで $x = 1, y = 0$ とし、逆算で $x, y$ を復元する。

再帰的に $bx' + (a \bmod b)y' = \gcd(b, a \bmod b)$ の解 $x', y'$ が得られたとする。$a \bmod b = a - \lfloor a/b \rfloor \cdot b$ なので:

$$
bx' + (a - \lfloor a/b \rfloor \cdot b)y' = \gcd(a, b)
$$

整理すると:

$$
a \cdot y' + b \cdot (x' - \lfloor a/b \rfloor \cdot y') = \gcd(a, b)
$$

したがって:

$$
x = y', \quad y = x' - \lfloor a/b \rfloor \cdot y'
$$

### 具体例

$252x + 105y = \gcd(252, 105)$ を解く。

**前進 (ユークリッドの互除法):**

| $a$ | $b$ | $q$ | $r$ |
|-----|-----|-----|-----|
| 252 | 105 | 2 | 42 |
| 105 | 42 | 2 | 21 |
| 42 | 21 | 2 | 0 |

$\gcd(252, 105) = 21$

**後退 (係数の逆算):**

基底: $21 \cdot 1 + 0 \cdot 0 = 21$ より $x = 1, y = 0$

ステップ3 ($a=42, b=21, q=2$): $x = 0, y = 1 - 2 \cdot 0 = 1$
- 検証: $42 \cdot 0 + 21 \cdot 1 = 21$ ✓

ステップ2 ($a=105, b=42, q=2$): $x = 1, y = 0 - 2 \cdot 1 = -2$
- 検証: $105 \cdot 1 + 42 \cdot (-2) = 105 - 84 = 21$ ✓

ステップ1 ($a=252, b=105, q=2$): $x = -2, y = 1 - 2 \cdot (-2) = 5$
- 検証: $252 \cdot (-2) + 105 \cdot 5 = -504 + 525 = 21$ ✓

## 実装

### 再帰版

```python title="ext_gcd_recursive.py"
def ext_gcd(a: int, b: int) -> tuple[int, int, int]:
    """Returns (g, x, y) such that a*x + b*y = g = gcd(a, b)"""
    if b == 0:
        return a, 1, 0
    g, x1, y1 = ext_gcd(b, a % b)
    return g, y1, x1 - (a // b) * y1
```

### 反復版

```python title="ext_gcd_iterative.py"
def ext_gcd(a: int, b: int) -> tuple[int, int, int]:
    old_r, r = a, b
    old_s, s = 1, 0
    old_t, t = 0, 1
    while r != 0:
        q = old_r // r
        old_r, r = r, old_r - q * r
        old_s, s = s, old_s - q * s
        old_t, t = t, old_t - q * t
    return old_r, old_s, old_t
```

### C++ 実装

```cpp title="ext_gcd.cpp"
tuple<long long, long long, long long> ext_gcd(long long a, long long b) {
    if (b == 0) return {a, 1, 0};
    auto [g, x, y] = ext_gcd(b, a % b);
    return {g, y, x - (a / b) * y};
}
```

## 計算量

ユークリッドの互除法と同じく $O(\log(\min(a, b)))$ で動作する。後退のステップは前進と同じ回数なので全体の計算量は変わらない。

## 応用

### モジュラ逆元

$\gcd(a, m) = 1$ のとき、$ax \equiv 1 \pmod{m}$ を満たす $x$ (モジュラ逆元) を求められる。$ax + my = 1$ の解を拡張ユークリッドで求め、$x \bmod m$ がモジュラ逆元となる。

### 不定方程式 $ax + by = c$

$\gcd(a, b) \mid c$ のとき解が存在する。$ax_0 + by_0 = \gcd(a, b)$ の解を $c / \gcd(a, b)$ 倍すれば特殊解が得られる。一般解は:

$$
x = x_0 \cdot \frac{c}{g} + \frac{b}{g} \cdot t, \quad y = y_0 \cdot \frac{c}{g} - \frac{a}{g} \cdot t \quad (t \in \mathbb{Z})
$$

### 中国剰余定理 (CRT)

拡張ユークリッドの互除法は CRT の構成的証明にも用いられる。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 非負整数 $a, b$ |
| 出力 | $\gcd(a, b)$ と $ax + by = \gcd(a, b)$ の解 $(x, y)$ |
| 時間計算量 | $O(\log(\min(a, b)))$ |
| 空間計算量 | $O(\log(\min(a, b)))$ (再帰版) / $O(1)$ (反復版) |
| 核心 | 再帰の逆算で係数を復元 |
| 応用 | モジュラ逆元、不定方程式、CRT |
