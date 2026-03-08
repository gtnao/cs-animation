---
title: "フロアサム (Floor Sum) 解説"
---

## フロアサムとは

フロアサム (Floor Sum) は、次の和を $O(\log m)$ で計算するアルゴリズムである。

$$
\sum_{i=0}^{n-1} \left\lfloor \frac{ai + b}{m} \right\rfloor
$$

ここで $n, m$ は正整数、$a, b$ は非負整数である。ACL (AtCoder Library) にも収録されている。

## 素朴な計算

各項を直接計算すると $O(n)$ だが、$n$ が大きい場合に遅い。

```python
# O(n)
def floor_sum_naive(n, a, b, m):
    return sum((a * i + b) // m for i in range(n))
```

## 高速アルゴリズム

### 核心アイデア

ユークリッドの互除法と同様の再帰構造を利用する。$a$ と $b$ を $m$ で割った商と余りに分解し、問題のサイズを縮小する。

### ステップ 1: $a \geq m$ または $b \geq m$ の場合

$a = qm + a'$ ($a' = a \bmod m$), $b = rm + b'$ ($b' = b \bmod m$) とすると:

$$
\left\lfloor \frac{ai + b}{m} \right\rfloor = qi + r + \left\lfloor \frac{a'i + b'}{m} \right\rfloor
$$

よって:

$$
\sum_{i=0}^{n-1} \left\lfloor \frac{ai + b}{m} \right\rfloor = q \cdot \frac{n(n-1)}{2} + rn + \sum_{i=0}^{n-1} \left\lfloor \frac{a'i + b'}{m} \right\rfloor
$$

### ステップ 2: $a < m$ かつ $b < m$ の場合 (反転)

$y_{\max} = \lfloor (an - 1 + b) / m \rfloor$ とおく。格子点 $(i, j)$ で $0 \leq i < n$, $0 \leq j < \lfloor (ai+b)/m \rfloor$ を満たすものの数を数えている。

座標を交換して $j$ について走査すると:

$$
\sum_{i=0}^{n-1} \left\lfloor \frac{ai + b}{m} \right\rfloor = (n-1) \cdot y_{\max} - \sum_{j=0}^{y_{\max}-1} \left\lfloor \frac{mj + m - b - 1}{a} \right\rfloor
$$

右辺の和は $\text{floor\_sum}(y_{\max}, m, m - b - 1, a)$ の形になっており、再帰呼び出しできる。

### 再帰の停止

$a = 0$ のとき $\lfloor b/m \rfloor \cdot n$ を返す。

### ユークリッドの互除法との対応

各再帰で $a$ と $m$ の役割が交換され、かつ $a \bmod m$ に縮小される。これはユークリッドの互除法と同じ構造であり、再帰の深さは $O(\log(\max(a, m)))$。

## 実装

```python title="floor_sum.py"
def floor_sum(n: int, a: int, b: int, m: int) -> int:
    ans = 0
    # Reduce a and b
    if a >= m:
        ans += n * (n - 1) // 2 * (a // m)
        a %= m
    if b >= m:
        ans += n * (b // m)
        b %= m
    y_max = (a * n + b) // m
    if y_max == 0:
        return ans
    x_max = y_max * m - b
    ans += (n - 1) * y_max - floor_sum(y_max, m, m - b - 1, a)
    return ans
```

```cpp title="floor_sum.cpp"
long long floor_sum(long long n, long long a, long long b, long long m) {
    long long ans = 0;
    if (a >= m) {
        ans += n * (n - 1) / 2 * (a / m);
        a %= m;
    }
    if (b >= m) {
        ans += n * (b / m);
        b %= m;
    }
    long long y_max = (a * n + b) / m;
    if (y_max == 0) return ans;
    ans += (n - 1) * y_max - floor_sum(y_max, m, m - b - 1, a);
    return ans;
}
```

## 計算量

### 時間計算量: $O(\log(\max(a, m)))$

ユークリッドの互除法と同じ収束速度。

### 空間計算量: $O(\log(\max(a, m)))$ (再帰版)

## 具体例

$\text{floor\_sum}(6, 4, 3, 5)$:

| $i$ | $(4i + 3) / 5$ | $\lfloor \cdot \rfloor$ |
|-----|-----------------|--------------------------|
| 0 | 3/5 | 0 |
| 1 | 7/5 | 1 |
| 2 | 11/5 | 2 |
| 3 | 15/5 | 3 |
| 4 | 19/5 | 3 |
| 5 | 23/5 | 4 |

合計: $0 + 1 + 2 + 3 + 3 + 4 = 13$

## 応用

### 格子点の数え上げ

直線 $y = (ax + b) / m$ の下の格子点の数を数える問題に直接対応する。

### 数論的関数の和

フロアサムは $\sum \lfloor n/k \rfloor$ 型の和の一般化と見なせ、約数関数の和やオイラー関数の和の計算にも関連する。

### AtCoder Library

ACL の `floor_sum` 関数として提供されており、ABC やその他のコンテストで出題されている。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n, a, b, m$ |
| 出力 | $\sum_{i=0}^{n-1} \lfloor (ai+b)/m \rfloor$ |
| 時間計算量 | $O(\log(\max(a, m)))$ |
| 核心 | ユークリッドの互除法的な再帰 |
| 応用 | 格子点計数、数論的関数の和 |
