---
title: "BIT / Fenwick Tree 解説"
---

## BIT / Fenwick Tree とは

Binary Indexed Tree (BIT)、別名 Fenwick Tree は、**累積和の計算**と**一点加算**をともに $O(\log n)$ で行えるデータ構造である。1994 年に Peter Fenwick が提案した。

セグメント木と同じ問題を解けるが、実装が非常にシンプルでメモリ効率も良いという利点がある。

### 計算量

| 操作 | 時間計算量 |
|------|-----------|
| 構築 | $O(n)$ または $O(n \log n)$ |
| 一点加算 | $O(\log n)$ |
| 接頭辞和 (prefix sum) | $O(\log n)$ |
| 区間和 | $O(\log n)$ |
| 空間計算量 | $O(n)$ |

## 核心アイデア: ビット演算による区間分割

### 1-indexed 配列

BIT は 1-indexed で使う。インデックス $i$ の BIT 配列 `bit[i]` は、ある連続する要素の和を保持する。

### 担当区間

インデックス $i$ が担当する区間の長さは、$i$ の最下位ビット (Lowest Set Bit, LSB) に等しい。

$$
\text{LSB}(i) = i \mathbin{\&} (-i)
$$

`bit[i]` は区間 $[i - \text{LSB}(i) + 1, i]$ の和を保持する。

### 例

$n = 8$ の場合:

| $i$ | 2進数 | LSB | 担当区間 |
|-----|------|-----|---------|
| 1 | 001 | 1 | $[1, 1]$ |
| 2 | 010 | 2 | $[1, 2]$ |
| 3 | 011 | 1 | $[3, 3]$ |
| 4 | 100 | 4 | $[1, 4]$ |
| 5 | 101 | 1 | $[5, 5]$ |
| 6 | 110 | 2 | $[5, 6]$ |
| 7 | 111 | 1 | $[7, 7]$ |
| 8 | 1000 | 8 | $[1, 8]$ |

## 接頭辞和 (prefix sum)

$\text{sum}(r)$ = $a[1] + a[2] + \cdots + a[r]$ を求めるには、$r$ から LSB を引きながら `bit` の値を足していく。

```python title="fenwick_sum.py"
def prefix_sum(bit, r):
    s = 0
    while r > 0:
        s += bit[r]
        r -= r & (-r)  # remove LSB
    return s
```

**なぜ正しいか**: $r$ から LSB を引く操作は、$r$ の最下位ビットを 0 にする操作である。各ステップで `bit[r]` は区間 $[r - \text{LSB}(r) + 1, r]$ の和を持っているので、これらを足し合わせると $[1, r]$ 全体の和になる。

**反復回数**: $r$ の 2 進表現のビット数は $\lfloor \log_2 r \rfloor + 1$ 以下であり、各ステップでビットが 1 つ消えるので、計算量は $O(\log n)$ である。

## 一点加算

位置 $i$ に $v$ を加算するには、$i$ に LSB を足しながら `bit` の値を更新する。

```python title="fenwick_add.py"
def add(bit, n, i, v):
    while i <= n:
        bit[i] += v
        i += i & (-i)  # add LSB
```

**なぜ正しいか**: $i$ に LSB を足す操作は、$i$ を担当区間に含む上位のインデックスに移動する。位置 $i$ の値が変わると、$i$ を含む全ての担当区間を更新する必要があり、この操作がまさにそれを行う。

## 区間和

区間 $[l, r]$ の和は、接頭辞和の差分で求められる:

$$
\text{sum}(l, r) = \text{prefix\_sum}(r) - \text{prefix\_sum}(l - 1)
$$

## 構築

### O(n log n) の方法

各要素に対して `add` を呼ぶ。

### O(n) の方法

```python title="fenwick_build.py"
def build(arr):
    n = len(arr)
    bit = [0] * (n + 1)
    for i in range(1, n + 1):
        bit[i] += arr[i - 1]
        j = i + (i & (-i))
        if j <= n:
            bit[j] += bit[i]
    return bit
```

## 完全な実装

```python title="fenwick_tree.py"
class FenwickTree:
    def __init__(self, n):
        self.n = n
        self.bit = [0] * (n + 1)

    def add(self, i, v):
        """Add v to position i (1-indexed)"""
        while i <= self.n:
            self.bit[i] += v
            i += i & (-i)

    def prefix_sum(self, r):
        """Sum of [1, r]"""
        s = 0
        while r > 0:
            s += self.bit[r]
            r -= r & (-r)
        return s

    def range_sum(self, l, r):
        """Sum of [l, r]"""
        return self.prefix_sum(r) - self.prefix_sum(l - 1)
```

## セグメント木との比較

| 特性 | BIT | セグメント木 |
|------|-----|------------|
| 実装量 | 非常に少ない | 多い |
| メモリ | $n + 1$ | $4n$ |
| 定数倍 | 速い | やや遅い |
| 対応演算 | 可逆な演算 (和、XOR) | 任意のモノイド |
| 区間更新 | 工夫が必要 | 遅延評価で対応 |

BIT は加算のように「逆演算」が存在する演算にしか対応できない。最小値クエリのように逆演算がない場合はセグメント木を使う必要がある。

## 応用

### 転倒数

配列の転倒数 (inversion count) を $O(n \log n)$ で求められる。後ろから要素を見ていき、BIT で「自分より小さい値がいくつあるか」を管理する。

### 座標圧縮 + BIT

値域が大きい場合、座標圧縮と組み合わせて使うことが多い。

## まとめ

| 項目 | 内容 |
|------|------|
| 一点加算 | $O(\log n)$ |
| 接頭辞和 | $O(\log n)$ |
| 空間 | $O(n)$ |
| 核心 | 最下位ビット (LSB) による区間分割 |
| 利点 | 実装が簡潔、メモリ効率が良い |
| 制約 | 可逆な演算のみ対応 |
