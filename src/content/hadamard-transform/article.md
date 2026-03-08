---
title: "Hadamard変換 (XOR畳み込み) 解説"
---

## Hadamard変換とは

**Walsh-Hadamard変換 (WHT)** は、XOR 畳み込みを $O(n \log n)$ で計算するためのアルゴリズムである。ここで $n = 2^k$ とする。

### XOR畳み込みの定義

2 つの集合関数 $f, g$ の XOR 畳み込み (XOR convolution) は

$$
h(S) = \sum_{T_1 \oplus T_2 = S} f(T_1) \cdot g(T_2)
$$

と定義される。ここで $\oplus$ はビット単位の XOR である。インデックスで書くと

$$
h[k] = \sum_{i \oplus j = k} f[i] \cdot g[j]
$$

## Walsh-Hadamard変換

### 定義

長さ $n = 2^k$ の配列 $a$ に対して、Walsh-Hadamard変換 $\hat{a}$ は

$$
\hat{a}[i] = \sum_{j=0}^{n-1} (-1)^{\mathrm{popcount}(i \mathbin{\&} j)} a[j]
$$

で定義される。ここで $\mathrm{popcount}(x)$ は $x$ のビット 1 の個数、$\mathbin{\&}$ はビット AND である。

### 逆変換

$$
a[i] = \frac{1}{n} \sum_{j=0}^{n-1} (-1)^{\mathrm{popcount}(i \mathbin{\&} j)} \hat{a}[j]
$$

順変換と同じ形で、最後に $n$ で割る。

### XOR畳み込みとの関係

$\widehat{f \ast_{\oplus} g} = \hat{f} \cdot \hat{g}$ (点ごとの積)

つまり:

1. $f$ と $g$ を Walsh-Hadamard変換する
2. 点ごとに積を取る
3. 逆変換する

## バタフライ演算

Walsh-Hadamard変換は FFT と同様のバタフライ構造を持つ。各ステージで

$$
\begin{pmatrix} a[i] \\ a[i + \text{half}] \end{pmatrix} \leftarrow \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix} \begin{pmatrix} a[i] \\ a[i + \text{half}] \end{pmatrix}
$$

という変換を行う。FFT と異なり、回転子 $\omega$ を使わないため実装が非常に簡潔である。

### 実装

```python title="hadamard.py"
def walsh_hadamard(a, invert=False):
    n = len(a)
    length = 1
    while length < n:
        for i in range(0, n, length * 2):
            for j in range(length):
                u = a[i + j]
                v = a[i + j + length]
                a[i + j] = u + v
                a[i + j + length] = u - v
        length *= 2

    if invert:
        for i in range(n):
            a[i] //= n

    return a
```

### FFT との比較

| | FFT | Walsh-Hadamard |
|---|---|---|
| 対応する畳み込み | 通常の多項式乗算 | XOR 畳み込み |
| バタフライ | $\begin{pmatrix} 1 & \omega \\ 1 & -\omega \end{pmatrix}$ | $\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$ |
| 回転子 | $\omega = e^{2\pi i / n}$ | 不要 |
| 演算 | 複素数 (or mod) | 整数 |

## XOR畳み込みの計算

```python title="xor_conv.py"
def xor_convolution(f, g):
    n = len(f)
    f = list(f)
    g = list(g)

    walsh_hadamard(f)
    walsh_hadamard(g)

    h = [f[i] * g[i] for i in range(n)]

    walsh_hadamard(h, invert=True)
    return h
```

## 計算量

- Walsh-Hadamard変換: $O(n \log n)$ ($n = 2^k$, $\log n$ ステージ、各 $O(n)$)
- XOR畳み込み全体: $O(n \log n)$

## AND/OR 畳み込みとの関係

| 畳み込み | 定義 | 使う変換 |
|----------|------|---------|
| OR | $h[k] = \sum_{i \mid j = k} f[i] g[j]$ | 下位集合ゼータ/メビウス |
| AND | $h[k] = \sum_{i \mathbin{\&} j = k} f[i] g[j]$ | 上位集合ゼータ/メビウス |
| XOR | $h[k] = \sum_{i \oplus j = k} f[i] g[j]$ | Walsh-Hadamard |

3 つの畳み込みはいずれも $O(n \log n)$ で計算可能であるが、使用する変換が異なる。

## 応用

- **XOR 条件付きの数え上げ**: $a_i \oplus a_j = k$ となるペアの数
- **確率・期待値計算**: XOR に関する独立性を利用
- **エラー訂正符号**: Walsh-Hadamard行列は符号理論で重要
- **量子計算**: Hadamard ゲートの古典アナログ

## Hadamard行列

$n \times n$ の Hadamard 行列 $H_n$ は

$$
H_1 = \begin{pmatrix} 1 \end{pmatrix}, \quad H_{2n} = \begin{pmatrix} H_n & H_n \\ H_n & -H_n \end{pmatrix}
$$

と再帰的に定義される。Walsh-Hadamard変換は $H_n$ による行列ベクトル積を $O(n \log n)$ で計算するアルゴリズムとも解釈できる。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $n = 2^k$ の配列 |
| 出力 | Walsh-Hadamard変換 or XOR畳み込み |
| 時間計算量 | $O(n \log n)$ |
| 空間計算量 | $O(n)$ (in-place) |
| 核心 | 回転子不要のバタフライ演算 |
| 応用 | XOR畳み込み、符号理論 |
