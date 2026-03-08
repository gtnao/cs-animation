---
title: "ミンコフスキー和 解説"
---

## ミンコフスキー和とは

2つの図形 $A$ と $B$ の **ミンコフスキー和 (Minkowski Sum)** は以下で定義される。

$$
A \oplus B = \{a + b \mid a \in A, b \in B\}
$$

直感的には、$B$ の「重心」を $A$ の全ての点に配置したときに $B$ が掃く領域である。

### 性質

- 2つの凸多角形のミンコフスキー和は凸多角形
- $A$ が $m$ 頂点、$B$ が $n$ 頂点なら、$A \oplus B$ は高々 $m + n$ 頂点

## 凸多角形のミンコフスキー和

### アルゴリズム

2つの凸多角形のミンコフスキー和は、辺の角度でマージすることで $O(m + n)$ で計算できる。

### 手順

1. 両方の凸多角形を反時計回りに並べる
2. 各多角形の最下端の頂点を開始点とする
3. 辺の角度が小さい方から順に処理する
4. 現在の頂点の和を結果に追加する
5. 角度が小さい方のポインタを進める (等しければ両方)

### 実装

```python title="minkowski_sum.py"
import math

def minkowski_sum(P, Q):
    """P, Q は反時計回りの凸多角形の頂点リスト"""
    # Find bottom-most points
    def bottom(poly):
        idx = 0
        for i in range(1, len(poly)):
            if poly[i][1] < poly[idx][1] or \
               (poly[i][1] == poly[idx][1] and poly[i][0] < poly[idx][0]):
                idx = i
        return idx

    def angle(p1, p2):
        return math.atan2(p2[1] - p1[1], p2[0] - p1[0])

    sp = bottom(P)
    sq = bottom(Q)
    m, n = len(P), len(Q)

    result = []
    i, j = 0, 0

    while i < m or j < n:
        pi = (i + sp) % m
        qi = (j + sq) % n
        result.append((P[pi][0] + Q[qi][0], P[pi][1] + Q[qi][1]))

        pn = ((i + 1) + sp) % m
        qn = ((j + 1) + sq) % n
        angle_p = angle(P[pi], P[pn]) if i < m else float('inf')
        angle_q = angle(Q[qi], Q[qn]) if j < n else float('inf')

        if abs(angle_p - angle_q) < 1e-9:
            i += 1
            j += 1
        elif angle_p < angle_q:
            i += 1
        else:
            j += 1

    return result
```

## 計算量

| 操作 | 計算量 |
|------|--------|
| 凸多角形のミンコフスキー和 | $O(m + n)$ |
| 一般の多角形 | $O(mn)$ |
| 凸多角形 (前処理にソート含む) | $O((m+n) \log(m+n))$ |

## 応用

### 衝突判定

ロボット $A$ が障害物 $B$ と衝突するかの判定は、ミンコフスキー和で簡潔に表現できる。

$A$ を原点中心に反転した図形を $-A$ とすると:

$$
A \text{ と } B \text{ が衝突} \iff 0 \in B \oplus (-A)
$$

つまり、ミンコフスキー和が原点を含むかどうかの判定に帰着できる。

### パス計画

ロボットの自由空間 (Configuration Space) の計算にミンコフスキー和が使われる。障害物を「膨張」させ、ロボットを点として扱うことで問題を単純化できる。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 2つの凸多角形 ($m$ 頂点, $n$ 頂点) |
| 出力 | ミンコフスキー和 (高々 $m + n$ 頂点の凸多角形) |
| 時間計算量 | $O(m + n)$ |
| 核心 | 辺の角度によるマージ |
