---
title: "Convex Hull Trick 解説"
---

## Convex Hull Trick とは

Convex Hull Trick (CHT) は、一次関数 $f_i(x) = a_i x + b_i$ の集合に対する最小値 (または最大値) クエリを効率的に処理するテクニックである。

$$
\min_{i} (a_i x + b_i)
$$

を $x$ を指定するたびに求めたい場面で使われる。

## 動機: DPの高速化

以下の形の DP 漸化式に現れる:

$$
dp[i] = \min_{j < i} (a_j \cdot x_i + b_j) + c_i
$$

ここで $a_j, b_j$ は $j$ のみに依存し、$x_i$ は $i$ のみに依存する。素朴には $O(n^2)$ だが、CHT を使うと $O(n)$ や $O(n \log n)$ に改善できる。

## アルゴリズム

### 直線の追加

傾き $a$ が**単調減少**の順に直線を追加する場合、凸包の管理はスタックで行える:

1. 新しい直線 $l$ を追加するとき、スタックの末尾の直線が $l$ によって不要になるかチェック
2. 不要なら除去し、繰り返す
3. $l$ をスタックに追加

### クエリ

$x$ が**単調増加**の順にクエリされる場合、スタックの先頭から順に最適な直線を探せばよい (ポインタを進めるだけ)。

```python title="convex_hull_trick.py"
class ConvexHullTrick:
    def __init__(self):
        self.lines = []  # (a, b)
        self.ptr = 0

    def bad(self, l1, l2, l3):
        # l2 is unnecessary if intersection of l1,l3 is left of intersection of l1,l2
        return (l3[1] - l1[1]) * (l1[0] - l2[0]) <= (l2[1] - l1[1]) * (l1[0] - l3[0])

    def add_line(self, a: int, b: int):
        line = (a, b)
        while len(self.lines) >= 2 and self.bad(self.lines[-2], self.lines[-1], line):
            self.lines.pop()
        self.lines.append(line)

    def query(self, x: int) -> int:
        while self.ptr + 1 < len(self.lines):
            a1, b1 = self.lines[self.ptr]
            a2, b2 = self.lines[self.ptr + 1]
            if a1 * x + b1 > a2 * x + b2:
                self.ptr += 1
            else:
                break
        a, b = self.lines[self.ptr]
        return a * x + b
```

## 計算量

### 命題: 単調な CHT は全体 $O(n)$

**証明:**

各直線は高々 1 回追加され、高々 1 回除去される。したがって直線の追加は償却 $O(1)$。

クエリのポインタは単調に増加するので、全クエリで合計 $O(n)$。 $\square$

### 一般の場合

傾きやクエリが単調でない場合は Li Chao Tree を使い $O(n \log n)$ で処理できる。

## まとめ

| 項目 | 内容 |
|------|------|
| 適用対象 | $\min_j(a_j x + b_j)$ 型の DP 最適化 |
| 時間計算量 | $O(n)$ (単調) / $O(n \log n)$ (一般) |
| 空間計算量 | $O(n)$ |
| 核心 | 不要な直線を凸包から除去 |
| 応用 | DP高速化、最小コスト計算 |
