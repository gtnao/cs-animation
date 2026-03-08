---
title: "Alien DP 解説"
---

## Alien DP とは

Alien DP (Aliens Trick, Lagrangian Relaxation, WQS Binary Search とも呼ばれる) は、**個数制約付き**の最適化 DP を、ラグランジュ緩和と二分探索を組み合わせて高速化するテクニックである。

IOI 2016 の問題 "Aliens" にちなんで名付けられた。

## 問題設定

$$
\min_{x} f(x) \quad \text{subject to} \quad g(x) = K
$$

ここで $f$ は最小化したいコスト、$g(x)$ は使用する要素数などの制約、$K$ は目標値。

素朴にはパラメータ $K$ を DP の状態に含める必要があり、計算量が増大する。

## 核心アイデア

ラグランジュ乗数 $\lambda$ を導入し、制約をペナルティとして目的関数に組み込む:

$$
L(\lambda) = \min_{x} \left( f(x) + \lambda \cdot g(x) \right)
$$

$\lambda$ を固定すれば $g$ の制約がなくなり、より単純な DP で解ける。

$L(\lambda)$ の最小化における $g(x)$ の値が $K$ に等しくなるような $\lambda$ を二分探索で求める。

## 適用条件

$f(x)$ を $g(x) = k$ の下での最適値として $h(k)$ と定義すると、$h$ が**凸関数** (convex) であること。

凸性があれば、接線の傾き $-\lambda$ を変化させることで $h(k)$ の全ての値にアクセスできる。

## アルゴリズム

```python title="alien_dp.py"
def alien_dp(solve_relaxed, target_k, lo, hi, eps=1e-9):
    # solve_relaxed(lambda) returns (optimal_value, count)
    while hi - lo > eps:
        mid = (lo + hi) / 2
        val, cnt = solve_relaxed(mid)
        if cnt <= target_k:
            hi = mid
        else:
            lo = mid
    val, cnt = solve_relaxed((lo + hi) / 2)
    # Recover: optimal = val - lambda * target_k
    return val - (lo + hi) / 2 * target_k
```

## 計算量

元の DP が個数制約なしで $O(T)$ で解けるとすると、Alien DP は $O(T \log V)$ ($V$ はペナルティの値域) で解ける。

個数制約を状態に含めた元の DP が $O(T \cdot K)$ であったのに対し、大幅な改善となる。

## まとめ

| 項目 | 内容 |
|------|------|
| 適用条件 | 最適値関数が凸 |
| 時間計算量 | $O(T \log V)$ |
| 核心 | ラグランジュ緩和で個数制約を除去し、二分探索で乗数を決定 |
| 応用 | 区間分割問題、辺数制約付き最短路 |
