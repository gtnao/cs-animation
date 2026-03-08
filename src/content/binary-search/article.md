---
title: "二分探索 解説"
---

## 二分探索とは

二分探索 (Binary Search) は、**ソート済み配列**から特定の値を効率的に探索するアルゴリズムである。探索範囲を毎回半分に絞ることで、$O(\log n)$ の時間計算量で探索を完了する。

### 基本的なアイデア

ソート済み配列 $A[0..n-1]$ から目標値 $T$ を探す場合を考える。

1. 探索範囲の中央要素 $A[\text{mid}]$ を $T$ と比較する
2. $A[\text{mid}] = T$ なら探索成功
3. $A[\text{mid}] < T$ なら $T$ は右半分にある
4. $A[\text{mid}] > T$ なら $T$ は左半分にある
5. 探索範囲が空になったら $T$ は存在しない

### 具体例

配列 `[1, 3, 5, 7, 9, 11, 13, 15, 17, 19]` から `13` を探す。

| ステップ | lo | hi | mid | A[mid] | 判定 |
|---------|----|----|-----|--------|------|
| 1 | 0 | 9 | 4 | 9 | 9 < 13 → 右へ |
| 2 | 5 | 9 | 7 | 15 | 15 > 13 → 左へ |
| 3 | 5 | 6 | 5 | 11 | 11 < 13 → 右へ |
| 4 | 6 | 6 | 6 | 13 | 発見! |

4 回の比較で 10 要素の配列から目標値を見つけた。

## 実装

### 基本的な二分探索

```python title="binary_search.py"
def binary_search(a: list[int], target: int) -> int:
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == target:
            return mid
        elif a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1  # not found
```

### オーバーフロー対策

`(lo + hi) // 2` は `lo` と `hi` が大きい場合にオーバーフローする可能性がある (C/C++ などの言語)。安全な計算方法は次の通りである。

$$
\text{mid} = lo + \lfloor (hi - lo) / 2 \rfloor
$$

Python は多倍長整数をサポートするのでこの問題は生じないが、他言語では注意が必要である。

## 正当性の証明

### ループ不変条件

以下のループ不変条件が成り立つ。

> $T$ が配列に存在するならば、$T$ は $A[lo..hi]$ の範囲内にある。

**初期化:** $lo = 0$, $hi = n - 1$ なので、全体が探索範囲である。

**保存:** ループ本体で次のいずれかが起こる。
- $A[\text{mid}] = T$: 発見して終了
- $A[\text{mid}] < T$: 配列はソート済みなので $A[0..mid]$ に $T$ は存在しない。$lo = mid + 1$ としても不変条件は保たれる
- $A[\text{mid}] > T$: 同様に $A[mid..n-1]$ に $T$ は存在しない。$hi = mid - 1$ としても不変条件は保たれる

**終了:** $lo > hi$ でループが終了した場合、探索範囲が空になったので $T$ は配列に存在しない。

## 計算量

### 時間計算量

各ステップで探索範囲が半分になるので、最大比較回数は $\lfloor \log_2 n \rfloor + 1$ 回である。

$$
T(n) = T(n/2) + O(1) = O(\log n)
$$

### 空間計算量

追加のメモリは定数個の変数のみなので $O(1)$ である。

## 変種

### lower_bound

$T$ **以上**の最小のインデックスを求める変種。同じ値が複数ある場合に最も左の位置を返す。

```python title="lower_bound.py"
def lower_bound(a: list[int], target: int) -> int:
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo
```

### upper_bound

$T$ **より大きい**最小のインデックスを求める変種。

```python title="upper_bound.py"
def upper_bound(a: list[int], target: int) -> int:
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] <= target:
            lo = mid + 1
        else:
            hi = mid
    return lo
```

### 一般化: 判定問題に対する二分探索

二分探索は「条件を満たす最小 (最大) の値を求める」問題に一般化できる。単調性のある判定関数 $f(x)$ に対して、$f(x)$ が真となる最小の $x$ を求める。

```python title="binary_search_general.py"
def binary_search_on_predicate(lo: int, hi: int, predicate) -> int:
    while lo < hi:
        mid = (lo + hi) // 2
        if predicate(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

この一般化は競技プログラミングで頻繁に使われる。「答えを決め打ちして判定する」テクニック (いわゆる「二分探索で答えを求める」) はこの応用である。

## 実数上の二分探索

整数だけでなく、実数上でも二分探索は適用できる。連続な単調関数 $f(x)$ に対して $f(x) = 0$ の解を求める (二分法) など。

```python title="bisection_method.py"
def bisection(f, lo: float, hi: float, eps: float = 1e-9) -> float:
    for _ in range(100):  # sufficient iterations
        mid = (lo + hi) / 2
        if f(mid) <= 0:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2
```

実数の場合はループ回数を固定する方法が安全である。$10^{-9}$ の精度が必要なら 100 回のループで十分 (探索範囲が $10^{18}$ 程度でも $10^{18} / 2^{100} \approx 10^{-12}$)。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | ソート済み配列 $A[0..n-1]$、目標値 $T$ |
| 出力 | $T$ のインデックス (存在しない場合は $-1$) |
| 時間計算量 | $O(\log n)$ |
| 空間計算量 | $O(1)$ |
| 前提条件 | 配列がソート済みであること |
| 変種 | lower_bound, upper_bound, 判定問題への一般化 |
