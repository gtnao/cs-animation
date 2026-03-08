---
title: "Disjoint Sparse Table 解説"
---

## Disjoint Sparse Table とは

Disjoint Sparse Table は、**半群** (結合法則を満たす演算) に対する静的な区間クエリを前処理 $O(n \log n)$、クエリ $O(1)$ で処理するデータ構造である。

通常の Sparse Table は冪等性 ($\min(x, x) = x$ のような性質) が必要だが、Disjoint Sparse Table は冪等性を必要としない。そのため、区間和や区間積など、冪等でない演算にも対応できる。

### 計算量

| 操作 | 時間計算量 |
|------|-----------|
| 構築 | $O(n \log n)$ |
| クエリ | $O(1)$ |
| 空間計算量 | $O(n \log n)$ |

## 通常の Sparse Table との比較

| 特性 | Sparse Table | Disjoint Sparse Table |
|------|-------------|----------------------|
| 対応演算 | 冪等半群 ($\min$, $\max$, $\gcd$) | 任意の半群 ($+$, $\times$, $\min$) |
| 構築 | $O(n \log n)$ | $O(n \log n)$ |
| クエリ | $O(1)$ | $O(1)$ |
| アイデア | 重なる 2 区間の合成 | 互いに素な 2 区間の合成 |

## 核心アイデア

### 構造

配列のサイズを $2$ の冪 $N$ に拡張する。各レベル $k$ ($k = 1, 2, \ldots, \lceil \log_2 N \rceil$) で、配列をサイズ $2^k$ のブロックに分割する。各ブロックの中心 $m$ を基準に:

- **左半分**: $m$ から左に向かう接尾辞和 (suffix aggregate) を計算
- **右半分**: $m$ から右に向かう接頭辞和 (prefix aggregate) を計算

### クエリの処理

区間 $[l, r]$ のクエリでは、$l$ と $r$ が「異なる半ブロック」に属する最小のレベル $k$ を見つける。このレベルでは:

- $\text{table}[k][l]$ は位置 $l$ からブロックの中心までの集約値
- $\text{table}[k][r]$ はブロックの中心から位置 $r$ までの集約値

この 2 つの区間は**互いに素** (重ならない) であるため、任意の半群で正しく合成できる。

### レベルの決定

$l$ と $r$ が異なる半ブロックに属するレベルは、$l \oplus r$ ($\oplus$ は XOR) の最上位ビットから決まる。

$$
k = \lfloor \log_2(l \oplus r) \rfloor + 1
$$

## 実装

```python title="disjoint_sparse_table.py"
import math

class DisjointSparseTable:
    def __init__(self, arr, op=lambda a, b: a + b):
        self.op = op
        self.n = len(arr)
        # Pad to power of 2
        self.N = 1
        while self.N < self.n:
            self.N <<= 1
        self.arr = list(arr) + [0] * (self.N - self.n)
        self.levels = int(math.log2(self.N)) + 1
        self.table = [[0] * self.N for _ in range(self.levels)]
        # Base
        for i in range(self.N):
            self.table[0][i] = self.arr[i]
        # Build
        for k in range(1, self.levels):
            block_size = 1 << k
            half = block_size >> 1
            for block in range(0, self.N, block_size):
                mid = block + half
                # Suffix from mid-1 to block
                self.table[k][mid - 1] = self.arr[mid - 1]
                for i in range(mid - 2, block - 1, -1):
                    self.table[k][i] = op(self.arr[i], self.table[k][i + 1])
                # Prefix from mid to block + block_size - 1
                self.table[k][mid] = self.arr[mid]
                for i in range(mid + 1, min(block + block_size, self.N)):
                    self.table[k][i] = op(self.table[k][i - 1], self.arr[i])

    def query(self, l, r):
        if l == r:
            return self.table[0][l]
        k = (l ^ r).bit_length()
        return self.op(self.table[k][l], self.table[k][r])
```

## 正当性の証明

### 命題: クエリが正しく区間の集約値を返す

**証明**: 区間 $[l, r]$ に対して $k = \lceil \log_2(l \oplus r) \rceil$ とする。

レベル $k$ のブロックサイズは $2^k$ であり、半ブロックのサイズは $2^{k-1}$ である。$l \oplus r$ の最上位ビットが $k-1$ ビット目であることから、$l$ と $r$ は同じブロック内で異なる半ブロックに属する。

$l$ は左半ブロック (中心より左) に、$r$ は右半ブロック (中心以降) にある。

- $\text{table}[k][l]$ = $\text{op}(a[l], a[l+1], \ldots, a[m-1])$ (左半ブロックの接尾辞)
- $\text{table}[k][r]$ = $\text{op}(a[m], a[m+1], \ldots, a[r])$ (右半ブロックの接頭辞)

$m$ は半ブロックの境界なので、$[l, m-1]$ と $[m, r]$ は互いに素であり、合わせて $[l, r]$ を正確にカバーする。よって $\text{op}(\text{table}[k][l], \text{table}[k][r])$ は正しい答えを返す。 $\square$

## 応用

### 区間積

乗算は冪等でないため通常の Sparse Table では使えないが、Disjoint Sparse Table なら使える。

### 区間 XOR

XOR は結合法則を満たす (半群) ので対応可能。

### 行列の区間積

行列の乗算は結合法則を満たすが冪等でない。Disjoint Sparse Table を使えば静的な区間行列積を $O(1)$ (行列のサイズに依存する定数倍) で求められる。

## まとめ

| 項目 | 内容 |
|------|------|
| 構築 | $O(n \log n)$ |
| クエリ | $O(1)$ |
| 空間 | $O(n \log n)$ |
| 条件 | 静的配列、半群 (結合法則のみ) |
| 核心 | ブロックの中心を基準に接頭辞・接尾辞の集約を計算 |
| 利点 | 冪等性が不要、加算・乗算にも対応 |
