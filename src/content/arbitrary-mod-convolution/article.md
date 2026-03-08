---
title: "任意modでの畳み込み 解説"
---

## 任意modでの畳み込みとは

NTT は $p = 998244353$ のような NTT-friendly な素数に限定される。任意の mod $m$ で畳み込みを行いたい場合、複数の NTT-friendly 素数で畳み込みを行い、中国剰余定理 (CRT) または Garner のアルゴリズムで結果を復元する手法が使われる。

### 問題設定

2 つの多項式 $A(x), B(x)$ が整数係数で与えられたとき、

$$
C(x) = A(x) \cdot B(x) \mod m
$$

を求めたい。ここで $m$ は任意の正整数 (必ずしも NTT-friendly でない) である。

## 素朴なアプローチ

直接 $O(n^2)$ の畳み込みを行えばよいが、$n$ が大きい場合は遅すぎる。

```python title="conv_naive.py"
def conv_naive(a, b, mod):
    n = len(a) + len(b) - 1
    c = [0] * n
    for i in range(len(a)):
        for j in range(len(b)):
            c[i + j] = (c[i + j] + a[i] * b[j]) % mod
    return c
```

## 手法 1: 3つの NTT の合成 (Garner のアルゴリズム)

### アイデア

NTT-friendly な 3 つの素数 $p_1, p_2, p_3$ を選ぶ。各 $p_i$ で NTT を用いて畳み込みを行い、Garner のアルゴリズムで復元する。

$p_1 \cdot p_2 \cdot p_3$ が畳み込みの各係数の真の値 (mod を取る前) より大きければ、正しく復元できる。

### 使用する素数

代表的な組み合わせ:

- $p_1 = 998244353$ ($\approx 10^9$)
- $p_2 = 985661441$ ($\approx 10^9$)
- $p_3 = 754974721$ ($\approx 7.5 \times 10^8$)

$p_1 \cdot p_2 \cdot p_3 \approx 7.4 \times 10^{26}$ なので、各係数が $10^{26}$ 程度までなら正しく復元できる。

### Garner のアルゴリズム

$x \equiv r_1 \pmod{p_1}$, $x \equiv r_2 \pmod{p_2}$, $x \equiv r_3 \pmod{p_3}$ を満たす $x$ を求める。

混合基数表現を用いる:

$$
x = v_1 + v_2 p_1 + v_3 p_1 p_2
$$

1. $v_1 = r_1$
2. $v_2 = (r_2 - v_1) \cdot p_1^{-1} \mod p_2$
3. $v_3 = ((r_3 - v_1) \cdot p_1^{-1} \mod p_3 - v_2) \cdot p_2^{-1} \mod p_3$

最終的に $x \mod m$ を求める。

### 実装

```python title="arbitrary_mod_conv.py"
def conv_arbitrary_mod(a, b, mod):
    p1, p2, p3 = 998244353, 985661441, 754974721

    c1 = ntt_conv(a, b, p1)  # NTT on mod p1
    c2 = ntt_conv(a, b, p2)  # NTT on mod p2
    c3 = ntt_conv(a, b, p3)  # NTT on mod p3

    n = len(c1)
    result = [0] * n

    p1_inv_p2 = pow(p1, p2 - 2, p2)
    p1_inv_p3 = pow(p1, p3 - 2, p3)
    p2_inv_p3 = pow(p2, p3 - 2, p3)

    for i in range(n):
        v1 = c1[i]
        v2 = (c2[i] - v1) * p1_inv_p2 % p2
        v3 = ((c3[i] - v1) * p1_inv_p3 % p3 - v2) * p2_inv_p3 % p3

        result[i] = (v1 + v2 * p1 + v3 * p1 * p2) % mod

    return result
```

## 手法 2: 浮動小数点 FFT + 分割

係数を上位・下位に分割して FFT を行う方法もある。$a_i = a_i^{H} \cdot D + a_i^{L}$ ($D = \lceil\sqrt{m}\rceil$) と分割し、4 回の FFT で畳み込みを行う。

ただし浮動小数点精度の問題があり、$n$ が大きい場合は注意が必要である。

## 計算量

| 手法 | 時間計算量 | 空間計算量 |
|------|-----------|-----------|
| Garner (3 NTT) | $O(n \log n)$ | $O(n)$ |
| FFT 分割 | $O(n \log n)$ | $O(n)$ |
| 素朴 | $O(n^2)$ | $O(n)$ |

定数倍は単一 NTT の約 3 倍 (3 回の NTT を行うため) である。

## 応用

- mod が NTT-friendly でない場合の多項式乗算
- 任意の mod での母関数の積
- 大きな mod での数え上げ問題

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 2 つの多項式と任意の mod $m$ |
| 出力 | 畳み込み結果 (mod $m$) |
| 時間計算量 | $O(n \log n)$ |
| 空間計算量 | $O(n)$ |
| 核心 | 複数の NTT + Garner のアルゴリズム |
| 利点 | mod の制約がない |
