---
title: "Mo's Algorithm 解説"
---

## Mo's Algorithm とは

Mo's Algorithm は、**オフライン**の区間クエリを $O((n + Q) \sqrt{n})$ で処理するアルゴリズムである。ここで $n$ は配列のサイズ、$Q$ はクエリの数である。

全てのクエリが事前に与えられている (オフライン) という条件のもと、クエリの処理順序を工夫することで、現在の区間を少しずつ拡張・縮小しながら効率的に全クエリに答える。

### 適用条件

- クエリがオフライン (全て事前に分かっている)
- 区間の端を 1 つ動かす操作が $O(1)$ または $O(\text{小さい定数})$
- 要素の追加・削除が可逆である

### 計算量

| 項目 | 計算量 |
|------|--------|
| 時間計算量 | $O((n + Q) \sqrt{n})$ |
| 空間計算量 | $O(n + Q)$ |

## 核心アイデア

### ウィンドウの伸縮

区間 $[l, r]$ に対する答えを管理する「ウィンドウ」を持つ。ウィンドウの端を 1 つずつ動かすことで、隣接する区間の答えを $O(1)$ で計算できる:

- **右に拡張**: $[l, r] \to [l, r+1]$ → 要素 $a[r+1]$ を追加
- **右を縮小**: $[l, r] \to [l, r-1]$ → 要素 $a[r]$ を除去
- **左に拡張**: $[l, r] \to [l-1, r]$ → 要素 $a[l-1]$ を追加
- **左を縮小**: $[l, r] \to [l+1, r]$ → 要素 $a[l]$ を除去

### クエリの並べ替え

素朴にクエリを順番に処理すると、ウィンドウの移動距離は最悪 $O(Qn)$ になる。Mo's Algorithm ではクエリを**平方分割に基づいて並べ替える**ことで、移動距離を $O((n + Q) \sqrt{n})$ に抑える。

並べ替え規則:
1. $l$ をブロック番号 $\lfloor l / \sqrt{n} \rfloor$ でグループ化
2. 同一ブロック内では $r$ の昇順にソート

## アルゴリズム

```python title="mos_algorithm.py"
import math

def mos_algorithm(arr, queries):
    n = len(arr)
    B = max(1, int(math.sqrt(n)))

    # Sort queries
    sorted_q = sorted(enumerate(queries), key=lambda x: (x[1][0] // B, x[1][1]))

    answers = [0] * len(queries)
    cur_l, cur_r = 0, -1
    cnt = {}
    distinct = 0

    def add(idx):
        nonlocal distinct
        v = arr[idx]
        cnt[v] = cnt.get(v, 0) + 1
        if cnt[v] == 1:
            distinct += 1

    def remove(idx):
        nonlocal distinct
        v = arr[idx]
        cnt[v] -= 1
        if cnt[v] == 0:
            distinct -= 1

    for orig_idx, (l, r) in sorted_q:
        while cur_r < r:
            cur_r += 1
            add(cur_r)
        while cur_r > r:
            remove(cur_r)
            cur_r -= 1
        while cur_l > l:
            cur_l -= 1
            add(cur_l)
        while cur_l < l:
            remove(cur_l)
            cur_l += 1
        answers[orig_idx] = distinct

    return answers
```

## 計算量の証明

### 命題: ウィンドウの総移動距離は $O((n + Q) \sqrt{n})$

**証明:**

$B = \sqrt{n}$ とする。

**右端 $r$ の移動距離:**

同一ブロック内のクエリは $r$ の昇順にソートされているため、ブロック内での $r$ の移動距離は $O(n)$。ブロック数は $O(\sqrt{n})$ なので、$r$ の総移動距離は $O(n \sqrt{n})$。

**左端 $l$ の移動距離:**

同一ブロック内では $l$ は $B$ の範囲内にあるので、クエリ間の $l$ の移動は $O(B) = O(\sqrt{n})$。全 $Q$ クエリに対して $O(Q\sqrt{n})$。

ブロックが切り替わるとき、$l$ は最大 $O(n)$ 動くが、切り替わりは $O(\sqrt{n})$ 回なので $O(n \sqrt{n})$。

**合計**: $O(n\sqrt{n} + Q\sqrt{n}) = O((n + Q)\sqrt{n})$ $\square$

## 奇偶最適化

同一ブロック内で、偶数番目のブロックでは $r$ を昇順、奇数番目のブロックでは $r$ を降順にソートする。これにより定数倍が約半分に改善される。

```python
sorted_q = sorted(queries, key=lambda x: (
    x[0] // B,
    x[1] if (x[0] // B) % 2 == 0 else -x[1]
))
```

## 応用例

### 区間の異なる値の種類数

最も典型的な応用。各要素の出現回数を管理し、追加・削除時に種類数を更新する。

### 区間の偶数個出現する要素の個数

出現回数のパリティを管理する。

### Mo's Algorithm on Trees

木上のパスクエリに Mo's Algorithm を適用する拡張。オイラーツアーを利用して木のパスを配列の区間に変換する。

## まとめ

| 項目 | 内容 |
|------|------|
| 時間計算量 | $O((n + Q) \sqrt{n})$ |
| 空間計算量 | $O(n + Q)$ |
| 条件 | オフライン、端の操作が $O(1)$ |
| 核心 | クエリのソートによるウィンドウ移動の最適化 |
| 利点 | 実装が比較的簡単、多くの区間クエリに適用可能 |
