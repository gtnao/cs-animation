---
title: "点の内包判定 解説"
---

## 点の内包判定とは

与えられた点 $q$ が多角形 $P$ の内部にあるか、外部にあるか、あるいは境界上にあるかを判定する問題である。

## Ray Casting 法 (Crossing Number法)

### アイデア

判定点から任意の方向 (通常は水平右方向) に半直線を引き、多角形の辺との交差回数を数える。

- 交差回数が **奇数** → 内部
- 交差回数が **偶数** → 外部

### 直感的な説明

多角形の外部から内部に入るには必ず辺を1回横切る。内部から外部に出るにも辺を1回横切る。したがって、外部の点からの半直線は偶数回交差し、内部の点からの半直線は奇数回交差する。

### 実装

```python title="point_in_polygon.py"
def point_in_polygon(polygon: list[tuple[float, float]], q: tuple[float, float]) -> bool:
    n = len(polygon)
    count = 0
    for i in range(n):
        pi = polygon[i]
        pj = polygon[(i + 1) % n]
        if ((pi[1] > q[1]) != (pj[1] > q[1])):
            x_intersect = pi[0] + (q[1] - pi[1]) / (pj[1] - pi[1]) * (pj[0] - pi[0])
            if q[0] < x_intersect:
                count += 1
    return count % 2 == 1
```

## Winding Number 法

### アイデア

判定点の周りを多角形が何回回るかを計算する。

$$
w = \frac{1}{2\pi} \sum_{i=0}^{n-1} \theta_i
$$

ここで $\theta_i$ は辺 $p_i p_{i+1}$ が判定点の周りに作る角度である。

- $w \neq 0$ → 内部
- $w = 0$ → 外部

Winding Number 法はより堅牢で、自己交差する多角形にも対応できる。

## 計算量

| 手法 | 時間計算量 | 前処理 |
|------|-----------|--------|
| Ray Casting | $O(n)$ | なし |
| Winding Number | $O(n)$ | なし |

凸多角形の場合は二分探索により $O(\log n)$ で判定可能である。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 多角形と判定点 |
| 出力 | 内部/外部/境界 |
| 時間計算量 | $O(n)$ |
| 核心 | 半直線と辺の交差回数の偶奇 |
