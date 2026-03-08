---
title: "ラグランジュ補間 解説"
---

## ラグランジュ補間とは

ラグランジュ補間 (Lagrange interpolation) は、$n$ 個の相異なる点 $(x_0, y_0), (x_1, y_1), \ldots, (x_{n-1}, y_{n-1})$ を全て通る **唯一の** $n-1$ 次以下の多項式を構成する方法である。

## 定理

### 存在と一意性

$n$ 個の相異なる $x$ 座標 $x_0, x_1, \ldots, x_{n-1}$ と対応する $y$ 座標が与えられたとき、全ての点を通る $n-1$ 次以下の多項式はちょうど一つ存在する。

## ラグランジュ基底多項式

### 定義

$i$ 番目のラグランジュ基底多項式 $L_i(x)$ を次のように定義する:

$$
L_i(x) = \prod_{j \neq i} \frac{x - x_j}{x_i - x_j}
$$

### 性質

$$
L_i(x_j) = \delta_{ij} = \begin{cases} 1 & \text{if } i = j \\ 0 & \text{if } i \neq j \end{cases}
$$

つまり $L_i$ は点 $x_i$ で 1、他の全ての点で 0 になる。

## 補間多項式

$$
P(x) = \sum_{i=0}^{n-1} y_i \cdot L_i(x) = \sum_{i=0}^{n-1} y_i \prod_{j \neq i} \frac{x - x_j}{x_i - x_j}
$$

各 $L_i$ は $x_i$ でのみ 1 で他では 0 なので、$P(x_k) = y_k$ が全ての $k$ で成り立つ。

## 具体例

3 点 $(0, 1), (1, 3), (2, 7)$ を通る多項式を求める。

$$
L_0(x) = \frac{(x-1)(x-2)}{(0-1)(0-2)} = \frac{(x-1)(x-2)}{2}
$$

$$
L_1(x) = \frac{(x-0)(x-2)}{(1-0)(1-2)} = \frac{x(x-2)}{-1} = -x(x-2)
$$

$$
L_2(x) = \frac{(x-0)(x-1)}{(2-0)(2-1)} = \frac{x(x-1)}{2}
$$

$$
P(x) = 1 \cdot \frac{(x-1)(x-2)}{2} + 3 \cdot (-x(x-2)) + 7 \cdot \frac{x(x-1)}{2}
$$

展開すると $P(x) = x^2 + x + 1$ が得られる。検算: $P(0) = 1$, $P(1) = 3$, $P(2) = 7$。

## 1 点での評価

特定の $x = t$ での値 $P(t)$ だけが必要な場合、多項式を陽に構成する必要はない。

$$
P(t) = \sum_{i=0}^{n-1} y_i \prod_{j \neq i} \frac{t - x_j}{x_i - x_j}
$$

を直接計算すれば $O(n^2)$ で求まる。

## 実装

```python title="lagrange.py"
def lagrange_interpolation(points: list[tuple[float, float]], t: float) -> float:
    """Evaluate interpolating polynomial at point t"""
    n = len(points)
    result = 0.0
    for i in range(n):
        xi, yi = points[i]
        li = 1.0
        for j in range(n):
            if j != i:
                xj = points[j][0]
                li *= (t - xj) / (xi - xj)
        result += yi * li
    return result
```

### mod p での実装

```python title="lagrange_mod.py"
def lagrange_mod(points: list[tuple[int, int]], t: int, mod: int) -> int:
    """Evaluate interpolating polynomial at point t modulo prime"""
    n = len(points)
    result = 0
    for i in range(n):
        xi, yi = points[i]
        num = 1
        den = 1
        for j in range(n):
            if j != i:
                xj = points[j][0]
                num = num * (t - xj) % mod
                den = den * (xi - xj) % mod
        result = (result + yi * num % mod * pow(den, mod - 2, mod)) % mod
    return result
```

## 計算量

| 処理 | 時間計算量 |
|------|-----------|
| 1 点での評価 | $O(n^2)$ |
| 多項式の構成 | $O(n^2)$ |
| $x_i = 0, 1, \ldots, n-1$ の場合の 1 点評価 | $O(n)$ (前処理あり) |

### 等間隔の点での高速化

$x_i = i$ ($i = 0, 1, \ldots, n-1$) の場合、分母 $\prod_{j \neq i}(i - j)$ は $(-1)^{n-1-i} \cdot i! \cdot (n-1-i)!$ と表せる。階乗の前処理により 1 点での評価が $O(n)$ で可能になる。

## 数値安定性に関する注意

浮動小数点演算では、データ点が多い場合や点の間隔が大きく異なる場合に数値誤差が問題になりうる。実用上は Neville の方法やバリセントリック補間 (barycentric interpolation) が数値的に安定である。

## 応用

- 多項式の再構成
- 秘密分散 (Shamir's Secret Sharing)
- 有限体上の多項式計算
- 競技プログラミングでの「$n$ 点の値から多項式を復元して別の点での値を求める」パターン

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n$ 個の点 $(x_i, y_i)$ |
| 出力 | 補間多項式 $P(x)$ |
| 次数 | 高々 $n-1$ 次 |
| 1 点評価 | $O(n^2)$ (一般), $O(n)$ (等間隔) |
| 核心 | 基底多項式 $L_i(x)$ の線形結合 |
