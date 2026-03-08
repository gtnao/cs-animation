---
title: "FFT (高速フーリエ変換) 解説"
---

## FFT とは

**FFT (Fast Fourier Transform, 高速フーリエ変換)** は、離散フーリエ変換 (DFT) を $O(n \log n)$ で計算するアルゴリズムである。多項式の乗算や信号処理など、幅広い分野で利用される。

### 離散フーリエ変換の定義

長さ $n$ の複素数列 $a = (a_0, a_1, \ldots, a_{n-1})$ に対して、DFT は次のように定義される。

$$
A_k = \sum_{j=0}^{n-1} a_j \cdot \omega_n^{jk}, \quad k = 0, 1, \ldots, n-1
$$

ここで $\omega_n = e^{2\pi i / n}$ は $n$ 乗根 (1 の原始 $n$ 乗根) である。

逆変換 (IDFT) は以下で与えられる。

$$
a_j = \frac{1}{n} \sum_{k=0}^{n-1} A_k \cdot \omega_n^{-jk}
$$

### 多項式乗算との関係

2 つの多項式 $A(x) = \sum_{i=0}^{n-1} a_i x^i$ と $B(x) = \sum_{i=0}^{n-1} b_i x^i$ の積 $C(x) = A(x) \cdot B(x)$ を求めたい場合、素朴に計算すると $O(n^2)$ かかる。

FFT を使うと以下の手順で $O(n \log n)$ に高速化できる。

1. $A$ と $B$ の係数列を DFT で変換する
2. 点ごとに掛け算する (pointwise multiplication)
3. 結果を IDFT で逆変換する

## 素朴な DFT

定義に従って直接計算すると $O(n^2)$ である。

```python title="dft_naive.py"
import cmath

def dft_naive(a):
    n = len(a)
    w = cmath.exp(2j * cmath.pi / n)
    return [sum(a[j] * w**(j*k) for j in range(n)) for k in range(n)]
```

## Cooley-Tukey アルゴリズム

FFT の最も代表的なアルゴリズムは **Cooley-Tukey アルゴリズム** (1965) である。$n$ が 2 の冪乗のとき、DFT を半分のサイズの 2 つの DFT に分割する。

### 核心アイデア：分割統治

多項式 $A(x) = a_0 + a_1 x + a_2 x^2 + \cdots + a_{n-1} x^{n-1}$ を偶数次の項と奇数次の項に分ける。

$$
A(x) = A_{\text{even}}(x^2) + x \cdot A_{\text{odd}}(x^2)
$$

ここで

$$
A_{\text{even}}(y) = a_0 + a_2 y + a_4 y^2 + \cdots
$$

$$
A_{\text{odd}}(y) = a_1 + a_3 y + a_5 y^2 + \cdots
$$

$\omega_n^k$ を代入すると

$$
A(\omega_n^k) = A_{\text{even}}(\omega_{n/2}^k) + \omega_n^k \cdot A_{\text{odd}}(\omega_{n/2}^k)
$$

$k \geq n/2$ のとき $\omega_n^{k+n/2} = -\omega_n^k$ を利用して

$$
A(\omega_n^{k+n/2}) = A_{\text{even}}(\omega_{n/2}^k) - \omega_n^k \cdot A_{\text{odd}}(\omega_{n/2}^k)
$$

これにより、サイズ $n$ の DFT をサイズ $n/2$ の DFT 2 つに帰着できる。

### バタフライ演算

上記の再帰を反復的に実装するのが **バタフライ演算** (butterfly operation) である。各ステージで隣接する要素ペアを更新する。

```
u = a[j]
v = w * a[j + half]
a[j]        = u + v
a[j + half] = u - v
```

### 実装

```python title="fft.py"
import cmath

def fft(a):
    n = len(a)
    if n == 1:
        return a

    # Bit-reverse permutation
    bits = n.bit_length() - 1
    rev = [0] * n
    for i in range(n):
        rev[i] = int(bin(i)[2:].zfill(bits)[::-1], 2)
    a = [a[rev[i]] for i in range(n)]

    # Butterfly stages
    length = 2
    while length <= n:
        half = length // 2
        w_base = cmath.exp(-2j * cmath.pi / length)
        for start in range(0, n, length):
            w = 1
            for k in range(half):
                u = a[start + k]
                v = w * a[start + k + half]
                a[start + k] = u + v
                a[start + k + half] = u - v
                w *= w_base
        length *= 2

    return a
```

## ビット逆順並べ替え

反復版 FFT ではまず配列をビット逆順 (bit-reversal permutation) に並べ替える。インデックス $i$ のビット列を逆転したものが新しいインデックスとなる。

例えば $n = 8$ ($\log_2 n = 3$ ビット) の場合:

| 元のインデックス | 2進表現 | 逆転 | 新インデックス |
|:---:|:---:|:---:|:---:|
| 0 | 000 | 000 | 0 |
| 1 | 001 | 100 | 4 |
| 2 | 010 | 010 | 2 |
| 3 | 011 | 110 | 6 |
| 4 | 100 | 001 | 1 |
| 5 | 101 | 101 | 5 |
| 6 | 110 | 011 | 3 |
| 7 | 111 | 111 | 7 |

## 計算量

### 時間計算量

FFT は $\log_2 n$ 個のステージからなり、各ステージで $n$ 回の演算を行う。

$$
T(n) = O(n \log n)
$$

### 空間計算量

in-place で計算可能なので $O(n)$ の追加空間で十分である。

## 多項式乗算の全体手順

2 つの多項式 $A(x)$, $B(x)$ (それぞれ次数 $n-1$ 以下) の積 $C(x)$ を求める。

1. $A$ と $B$ を長さ $2n$ にゼロ埋めする
2. FFT で $A$ と $B$ を DFT 変換 → $\hat{A}$, $\hat{B}$
3. 点ごとに積を取る: $\hat{C}_k = \hat{A}_k \cdot \hat{B}_k$
4. IDFT で $\hat{C}$ を逆変換 → $C$

```python title="poly_mul.py"
def poly_mul(a, b):
    n = 1
    while n < len(a) + len(b):
        n *= 2
    a = a + [0] * (n - len(a))
    b = b + [0] * (n - len(b))

    fa = fft(a)
    fb = fft(b)
    fc = [fa[i] * fb[i] for i in range(n)]

    c = ifft(fc)
    return [round(x.real) for x in c]
```

## 応用

| 応用分野 | 説明 |
|----------|------|
| 多項式乗算 | $O(n \log n)$ での畳み込み |
| 大整数乗算 | 桁を係数とみなして多項式乗算 |
| 信号処理 | 周波数解析、フィルタリング |
| 画像処理 | 2次元 FFT による周波数領域処理 |
| 文字列マッチング | ワイルドカード付きパターンマッチング |

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $n$ ($2$ の冪) の数列 |
| 出力 | DFT 結果 (長さ $n$) |
| 時間計算量 | $O(n \log n)$ |
| 空間計算量 | $O(n)$ |
| 核心 | 分割統治 + バタフライ演算 |
| 主要応用 | 多項式乗算、信号処理 |
