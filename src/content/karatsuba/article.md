---
title: "Karatsuba法 解説"
---

## Karatsuba法とは

**Karatsuba法** は、多項式や大整数の乗算を $O(n^{\log_2 3}) \approx O(n^{1.585})$ で行う分割統治アルゴリズムである。1960年に Anatolii Karatsuba によって発見された。

### 問題設定

2 つの $n$ 次多項式 (または $n$ 桁の大整数) $A$ と $B$ の積 $C = A \cdot B$ を求めたい。素朴な方法では $O(n^2)$ の乗算が必要である。

## 基本アイデア

### 多項式の分割

$A(x) = A_0(x) + x^m \cdot A_1(x)$, $B(x) = B_0(x) + x^m \cdot B_1(x)$ と分割する ($m = \lceil n/2 \rceil$)。

素朴に展開すると

$$
C = A_0 B_0 + (A_0 B_1 + A_1 B_0) x^m + A_1 B_1 x^{2m}
$$

これには 4 回の半分サイズの乗算が必要で、$T(n) = 4T(n/2) + O(n)$ → $O(n^2)$ と改善されない。

### Karatsuba の工夫

以下の 3 つの積だけで十分であることに気づく。

$$
z_0 = A_0 \cdot B_0
$$

$$
z_2 = A_1 \cdot B_1
$$

$$
z_1 = (A_0 + A_1)(B_0 + B_1) - z_0 - z_2
$$

すると $C = z_0 + z_1 \cdot x^m + z_2 \cdot x^{2m}$ である。

**なぜ正しいか:** $(A_0 + A_1)(B_0 + B_1) = A_0 B_0 + A_0 B_1 + A_1 B_0 + A_1 B_1 = z_0 + (A_0 B_1 + A_1 B_0) + z_2$ なので $z_1 = A_0 B_1 + A_1 B_0$ が正しく求まる。

## 計算量

漸化式は

$$
T(n) = 3T(n/2) + O(n)
$$

Master Theorem より

$$
T(n) = O(n^{\log_2 3}) \approx O(n^{1.585})
$$

素朴な $O(n^2)$ と FFT の $O(n \log n)$ の中間に位置する。

## 実装

```python title="karatsuba.py"
def karatsuba(a, b):
    n = max(len(a), len(b))
    if n <= 32:  # base case: naive multiplication
        c = [0] * (len(a) + len(b) - 1)
        for i in range(len(a)):
            for j in range(len(b)):
                c[i + j] += a[i] * b[j]
        return c

    # Pad to same length
    a = a + [0] * (n - len(a))
    b = b + [0] * (n - len(b))

    m = n // 2

    a0, a1 = a[:m], a[m:]
    b0, b1 = b[:m], b[m:]

    # a0 + a1, b0 + b1
    max_len = max(len(a0), len(a1))
    sum_a = [0] * max_len
    sum_b = [0] * max_len
    for i in range(len(a0)): sum_a[i] += a0[i]
    for i in range(len(a1)): sum_a[i] += a1[i]
    for i in range(len(b0)): sum_b[i] += b0[i]
    for i in range(len(b1)): sum_b[i] += b1[i]

    z0 = karatsuba(a0, b0)
    z2 = karatsuba(a1, b1)
    z1_full = karatsuba(sum_a, sum_b)

    # z1 = z1_full - z0 - z2
    result_len = len(a) + len(b) - 1
    c = [0] * result_len
    for i in range(len(z0)):
        c[i] += z0[i]
    for i in range(len(z2)):
        c[i + 2 * m] += z2[i]

    z1_len = max(len(z1_full), len(z0), len(z2))
    z1 = [0] * z1_len
    for i in range(len(z1_full)): z1[i] += z1_full[i]
    for i in range(len(z0)): z1[i] -= z0[i]
    for i in range(len(z2)): z1[i] -= z2[i]

    for i in range(len(z1)):
        c[i + m] += z1[i]

    return c
```

## 大整数への応用

大整数の乗算にも同様に適用できる。$n$ 桁の整数を上位・下位に分割し、3 回の半分サイズの乗算で積を求める。繰り上がり処理が必要な点だけ注意する。

## FFT との比較

| | Karatsuba | FFT |
|---|---|---|
| 計算量 | $O(n^{1.585})$ | $O(n \log n)$ |
| 定数倍 | 小さい | やや大きい |
| 実装の複雑さ | 簡単 | やや複雑 |
| 有効な $n$ の範囲 | 小〜中 ($n < 10^4$ 程度) | 大 ($n > 10^4$) |
| 精度 | 整数演算なら誤差なし | 浮動小数点誤差あり (FFT の場合) |

実用的には、$n$ が小さい場合は Karatsuba、大きい場合は FFT/NTT を使うことが多い。

## 一般化: Toom-Cook 法

Karatsuba 法は Toom-Cook 法 (Toom-2) の特殊ケースである。Toom-$k$ では $k$ 分割して $2k - 1$ 回の乗算を行う。

| 手法 | 分割数 | 乗算回数 | 計算量 |
|------|--------|---------|--------|
| Toom-2 (Karatsuba) | 2 | 3 | $O(n^{1.585})$ |
| Toom-3 | 3 | 5 | $O(n^{1.465})$ |
| Toom-4 | 4 | 7 | $O(n^{1.404})$ |

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 2 つの多項式 (長さ $n$) |
| 出力 | 積 (長さ $2n - 1$) |
| 時間計算量 | $O(n^{\log_2 3}) \approx O(n^{1.585})$ |
| 空間計算量 | $O(n \log n)$ (再帰スタック) |
| 核心 | 4 回の乗算を 3 回に削減 |
| 応用 | 大整数乗算、多項式乗算 |
