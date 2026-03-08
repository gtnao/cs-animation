---
title: "最近点対 (Closest Pair) 解説"
---

## 最近点対問題とは

平面上に $n$ 個の点が与えられたとき、最も距離が近い点の組を求める問題である。

$$
\min_{i \neq j} \|p_i - p_j\|_2
$$

## 素朴なアプローチ

全ての点の組 $\binom{n}{2}$ を調べれば $O(n^2)$ で解ける。

```python
def closest_pair_naive(points):
    n = len(points)
    best = float('inf')
    for i in range(n):
        for j in range(i + 1, n):
            d = dist(points[i], points[j])
            if d < best:
                best = d
                pair = (i, j)
    return pair, best
```

## 分割統治法

分割統治法により $O(n \log n)$ で解ける。

### アルゴリズムの手順

1. 点を $x$ 座標でソートする
2. 点集合を左半分と右半分に分割する
3. 各半分で再帰的に最近点対を求める
4. 左右の最近距離の小さい方を $\delta$ とする
5. 分割線から距離 $\delta$ 以内の点を $y$ 座標でソートし、近傍の点対を調べる

### ステップ5 の計算量

分割線から距離 $\delta$ 以内の帯状領域にある点について、各点は $y$ 座標の差が $\delta$ 以内の点のみを調べればよい。鳩の巣原理により、各点について調べる必要がある点の数は高々7個である。

### 実装

```python title="closest_pair.py"
import math

def closest_pair(points):
    def dist(p, q):
        return math.sqrt((p[0] - q[0])**2 + (p[1] - q[1])**2)

    def solve(pts):
        n = len(pts)
        if n <= 3:
            best = float('inf')
            pair = None
            for i in range(n):
                for j in range(i + 1, n):
                    d = dist(pts[i], pts[j])
                    if d < best:
                        best, pair = d, (pts[i], pts[j])
            return pair, best

        mid = n // 2
        mid_x = pts[mid][0]
        left_pair, left_d = solve(pts[:mid])
        right_pair, right_d = solve(pts[mid:])

        if left_d < right_d:
            best_pair, delta = left_pair, left_d
        else:
            best_pair, delta = right_pair, right_d

        # Strip
        strip = [p for p in pts if abs(p[0] - mid_x) < delta]
        strip.sort(key=lambda p: p[1])

        for i in range(len(strip)):
            j = i + 1
            while j < len(strip) and strip[j][1] - strip[i][1] < delta:
                d = dist(strip[i], strip[j])
                if d < delta:
                    delta = d
                    best_pair = (strip[i], strip[j])
                j += 1

        return best_pair, delta

    pts = sorted(points)
    return solve(pts)
```

## 計算量の解析

再帰の計算量は以下のマスター定理で解析できる。

$$
T(n) = 2T(n/2) + O(n \log n)
$$

帯状領域のソートに $O(n \log n)$ かかるため、全体は $O(n \log^2 n)$ となる。マージソートを事前に行うことで $O(n \log n)$ に改善可能である。

## ランダム化アルゴリズム

ランダムに点を挿入し、グリッドベースの手法を使うことで期待計算量 $O(n)$ のアルゴリズムも存在する。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 平面上の $n$ 点 |
| 出力 | 最近点対とその距離 |
| 時間計算量 | $O(n \log n)$ |
| 空間計算量 | $O(n)$ |
| 核心 | 分割統治 + 帯状領域の性質 |
