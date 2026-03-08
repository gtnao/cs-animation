---
title: "離散対数 Baby-step Giant-step 解説"
---

## 離散対数問題とは

離散対数問題 (Discrete Logarithm Problem, DLP) は、素数 $p$、底 $a$、目標値 $b$ が与えられたとき:

$$
a^x \equiv b \pmod{p}
$$

を満たす最小の非負整数 $x$ を求める問題である。

この問題は暗号理論 (Diffie-Hellman 鍵交換、ElGamal 暗号など) の安全性の基盤となっている。

## Baby-step Giant-step アルゴリズム

### 概要

Baby-step Giant-step (BSGS) は D. Shanks が1971年に提案した、離散対数問題を $O(\sqrt{p})$ の時間と空間で解くアルゴリズムである。

### 基本アイデア

$m = \lceil \sqrt{p} \rceil$ とおく。$x = im + j$ ($0 \leq j < m$, $0 \leq i < m$) と表すと:

$$
a^{im + j} \equiv b \pmod{p}
$$

$$
a^j \equiv b \cdot (a^{-m})^i \pmod{p}
$$

左辺 (baby step) と右辺 (giant step) をそれぞれ列挙し、一致するものを探す。

### 手順

1. **Baby step:** $a^j \bmod p$ を $j = 0, 1, \ldots, m-1$ について計算し、ハッシュテーブルに格納
2. **Giant step:** $\gamma = b \cdot (a^{-m})^i \bmod p$ を $i = 0, 1, \ldots, m-1$ について計算し、テーブルに $\gamma$ が存在するか検索
3. 一致が見つかれば $x = im + j$

### 具体例

$3^x \equiv 13 \pmod{17}$ を解く。$m = \lceil \sqrt{17} \rceil = 5$。

**Baby step:**

| $j$ | $3^j \bmod 17$ |
|-----|-----------------|
| 0 | 1 |
| 1 | 3 |
| 2 | 9 |
| 3 | 10 |
| 4 | 13 |

**Giant step:** $a^{-m} = 3^{-5} \equiv 3^{11} \equiv 7 \pmod{17}$

| $i$ | $13 \cdot 7^i \bmod 17$ | テーブル検索 |
|-----|--------------------------|-------------|
| 0 | 13 | 13 → j=4 ✓ |

$x = 0 \times 5 + 4 = 4$。検証: $3^4 = 81 \equiv 13 \pmod{17}$ ✓

## 正当性

### 定理: BSGS は正しい解を返す

**証明:** 解 $x$ が存在するなら $0 \leq x < p-1$ (フェルマーの小定理より $a^{p-1} \equiv 1$)。$x = im + j$ と書くと $0 \leq i < m$, $0 \leq j < m$ ($m \geq \sqrt{p-1}$ なので $im + j$ は $0$ から $m^2 - 1 \geq p - 2$ の全ての値を取れる)。

Baby step で $a^j$ をテーブルに格納し、Giant step で $b \cdot a^{-im}$ を計算する。$a^x = b$ なら $a^j = b \cdot a^{-im}$ なので必ず一致が見つかる。 $\square$

## 計算量

### 時間計算量: $O(\sqrt{p})$

Baby step: $m = O(\sqrt{p})$ 回の乗算とハッシュテーブルへの挿入。
Giant step: 最大 $m = O(\sqrt{p})$ 回の乗算とハッシュテーブルの検索。
全体: $O(\sqrt{p})$。

### 空間計算量: $O(\sqrt{p})$

ハッシュテーブルに $m$ 個のエントリを格納。

## 実装

```python title="bsgs.py"
import math

def bsgs(a: int, b: int, p: int) -> int | None:
    """Solve a^x ≡ b (mod p). Returns x or None."""
    m = math.isqrt(p) + 1
    # Baby step
    table = {}
    val = 1
    for j in range(m):
        table[val] = j
        val = val * a % p
    # Giant step: a^(-m) mod p
    a_inv_m = pow(a, p - 1 - m, p)
    gamma = b
    for i in range(m):
        if gamma in table:
            return i * m + table[gamma]
        gamma = gamma * a_inv_m % p
    return None
```

```cpp title="bsgs.cpp"
long long bsgs(long long a, long long b, long long p) {
    long long m = (long long)ceil(sqrt((double)p));
    unordered_map<long long, long long> table;
    long long val = 1;
    for (long long j = 0; j < m; j++) {
        table[val] = j;
        val = val * a % p;
    }
    long long a_inv_m = power(a, p - 1 - m, p);
    long long gamma = b;
    for (long long i = 0; i < m; i++) {
        if (table.count(gamma)) return i * m + table[gamma];
        gamma = gamma * a_inv_m % p;
    }
    return -1; // no solution
}
```

## 応用と発展

### 一般化

$\gcd(a, p) \neq 1$ の場合にも対応した拡張 BSGS が存在する。$a$ と $p$ の公約数を順次取り除いてから通常の BSGS を適用する。

### Pohlig-Hellman アルゴリズム

群の位数 $p-1$ の素因数分解が既知の場合、各素数べき成分ごとに離散対数を求め、CRT で統合する。位数が滑らかな (smooth) 場合に高速。

## まとめ

| 項目 | 内容 |
|------|------|
| 問題 | $a^x \equiv b \pmod{p}$ |
| 時間計算量 | $O(\sqrt{p})$ |
| 空間計算量 | $O(\sqrt{p})$ |
| 核心 | $x = im + j$ と分解して表引き |
| 応用 | 暗号解析、原始根の判定 |
