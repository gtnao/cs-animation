---
title: "NTT (数論変換) 解説"
---

## NTT とは

**NTT (Number Theoretic Transform, 数論変換)** は、FFT の整数版ともいえるアルゴリズムである。複素数の代わりに有限体 $\mathbb{F}_p$ 上の原始根を用いることで、浮動小数点誤差なしに多項式乗算を $O(n \log n)$ で実現する。

### 基本的な考え方

FFT では $1$ の $n$ 乗根 $\omega_n = e^{2\pi i / n}$ を用いた。NTT では素数 $p$ に対して

$$
\omega_n = g^{(p-1)/n} \mod p
$$

を用いる。ここで $g$ は $\mathbb{F}_p$ の原始根である。$n \mid (p-1)$ であれば $\omega_n$ は $\mathbb{F}_p$ における $1$ の原始 $n$ 乗根となる。

### 定義

長さ $n$ の数列 $a = (a_0, a_1, \ldots, a_{n-1})$ に対して、NTT は次のように定義される。

$$
A_k = \sum_{j=0}^{n-1} a_j \cdot \omega_n^{jk} \mod p
$$

逆変換は

$$
a_j = n^{-1} \sum_{k=0}^{n-1} A_k \cdot \omega_n^{-jk} \mod p
$$

## NTT-friendly な素数

NTT を効率的に行うには、$p - 1$ が大きな $2$ の冪で割り切れる素数が望ましい。代表的なものは以下の通り。

| 素数 $p$ | $p - 1$ の因数分解 | 原始根 $g$ | 最大 $n$ |
|-----------|-------------------|------------|----------|
| $998244353$ | $2^{23} \times 119$ | $3$ | $2^{23}$ |
| $985661441$ | $2^{23} \times 117.5...$ | $3$ | $2^{23}$ |
| $754974721$ | $2^{24} \times 45$ | $11$ | $2^{24}$ |
| $469762049$ | $2^{26} \times 7$ | $3$ | $2^{26}$ |

特に $p = 998244353$ は競技プログラミングで頻出する。

## アルゴリズム

NTT の構造は FFT と全く同じである。唯一の違いは、複素指数関数の代わりにモジュラー演算を用いる点である。

### 実装

```python title="ntt.py"
MOD = 998244353
PRIM_ROOT = 3

def mod_pow(base, exp, mod):
    result = 1
    base %= mod
    while exp > 0:
        if exp & 1:
            result = result * base % mod
        exp >>= 1
        base = base * base % mod
    return result

def ntt(a, invert=False):
    n = len(a)
    bits = n.bit_length() - 1

    # Bit-reverse permutation
    for i in range(n):
        j = int(bin(i)[2:].zfill(bits)[::-1], 2)
        if i < j:
            a[i], a[j] = a[j], a[i]

    length = 2
    while length <= n:
        half = length // 2
        w = mod_pow(PRIM_ROOT, (MOD - 1) // length, MOD)
        if invert:
            w = mod_pow(w, MOD - 2, MOD)

        for start in range(0, n, length):
            wk = 1
            for k in range(half):
                u = a[start + k]
                v = a[start + k + half] * wk % MOD
                a[start + k] = (u + v) % MOD
                a[start + k + half] = (u - v) % MOD
                wk = wk * w % MOD
        length *= 2

    if invert:
        inv_n = mod_pow(n, MOD - 2, MOD)
        for i in range(n):
            a[i] = a[i] * inv_n % MOD

    return a
```

### FFT との対比

| | FFT | NTT |
|---|---|---|
| 体 | $\mathbb{C}$ | $\mathbb{F}_p$ |
| $n$ 乗根 | $e^{2\pi i / n}$ | $g^{(p-1)/n} \mod p$ |
| 精度 | 浮動小数点誤差あり | 誤差なし (整数演算) |
| 逆元 | $1/n$ | $n^{-1} \mod p$ |
| 制約 | $n$ は 2 の冪 | $n \mid (p-1)$, $n$ は 2 の冪 |

## 多項式乗算

```python title="poly_mul_ntt.py"
def poly_mul(a, b):
    n = 1
    while n < len(a) + len(b):
        n *= 2
    a = a + [0] * (n - len(a))
    b = b + [0] * (n - len(b))

    ntt(a)
    ntt(b)
    c = [(a[i] * b[i]) % MOD for i in range(n)]
    ntt(c, invert=True)

    return c
```

## 計算量

- 時間計算量: $O(n \log n)$
- 空間計算量: $O(n)$

各ステージで $O(n)$ のモジュラー乗算を行い、$\log n$ ステージある。

## 応用

- **多項式乗算 (mod p)**: 整数係数の多項式積を正確に計算
- **畳み込み**: 数列の畳み込みを $O(n \log n)$ で計算
- **数え上げ問題**: 母関数の積を高速に求める
- **形式的べき級数**: FPS の各種演算の基盤

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $n$ の整数列 (mod $p$) |
| 出力 | NTT 結果 (長さ $n$) |
| 時間計算量 | $O(n \log n)$ |
| 空間計算量 | $O(n)$ |
| 核心 | 有限体上の原始根による FFT |
| 利点 | 浮動小数点誤差なし |
