---
title: "Sparse Table 解説"
---

## Sparse Table とは

Sparse Table は、**静的な配列**に対する区間最小値 (Range Minimum Query, RMQ) を前処理 $O(n \log n)$、クエリ $O(1)$ で処理するデータ構造である。

「静的」とは、構築後に配列の値が変化しないことを意味する。更新が不要な場合、セグメント木 ($O(\log n)$ クエリ) よりも高速にクエリに答えられる。

### 計算量

| 操作 | 時間計算量 |
|------|-----------|
| 構築 | $O(n \log n)$ |
| クエリ | $O(1)$ |
| 空間計算量 | $O(n \log n)$ |

## 核心アイデア: 冪乗区間の前処理

### テーブルの定義

2次元配列 $\text{table}[k][i]$ を次のように定義する:

$$
\text{table}[k][i] = \min(a[i], a[i+1], \ldots, a[i + 2^k - 1])
$$

すなわち、位置 $i$ から始まる長さ $2^k$ の区間の最小値である。

### 構築

**ベースケース** ($k = 0$):

$$
\text{table}[0][i] = a[i]
$$

**再帰** ($k \geq 1$):

$$
\text{table}[k][i] = \min(\text{table}[k-1][i],\ \text{table}[k-1][i + 2^{k-1}])
$$

長さ $2^k$ の区間を、前半 $2^{k-1}$ と後半 $2^{k-1}$ に分割し、それぞれの最小値から全体の最小値を求めている。

```python title="sparse_table_build.py"
import math

def build_sparse_table(arr):
    n = len(arr)
    K = int(math.log2(n)) + 1
    table = [[0] * n for _ in range(K)]
    table[0] = list(arr)
    for k in range(1, K):
        for i in range(n - (1 << k) + 1):
            table[k][i] = min(table[k-1][i], table[k-1][i + (1 << (k-1))])
    return table
```

### 構築の計算量

テーブルのセル数は $O(n \log n)$ であり、各セルの計算は $O(1)$ なので、構築は $O(n \log n)$ である。

## クエリ: O(1) の区間最小値

### アイデア: 2 つの重なる区間

区間 $[l, r]$ の最小値を求めるには、$k = \lfloor \log_2(r - l + 1) \rfloor$ として:

$$
\text{query}(l, r) = \min(\text{table}[k][l],\ \text{table}[k][r - 2^k + 1])
$$

2つの区間 $[l, l + 2^k - 1]$ と $[r - 2^k + 1, r]$ は重なる可能性があるが、$\min$ 演算は**冪等** ($\min(x, x) = x$) なので、重複があっても結果は正しい。

```python title="sparse_table_query.py"
import math

def query(table, l, r):
    k = int(math.log2(r - l + 1))
    return min(table[k][l], table[k][r - (1 << k) + 1])
```

### なぜ O(1) なのか

$k$ の計算は $O(1)$ (事前にテーブルを用意するか、ビット演算で計算)。テーブル参照と $\min$ も $O(1)$。したがって全体で $O(1)$ である。

### 正当性の証明

**命題**: $k = \lfloor \log_2(r - l + 1) \rfloor$ とすると、$[l, l + 2^k - 1]$ と $[r - 2^k + 1, r]$ は区間 $[l, r]$ を完全にカバーする。

**証明**: $L = r - l + 1$ (区間の長さ) とする。$k = \lfloor \log_2 L \rfloor$ より $2^k \leq L < 2^{k+1}$。

- 第1区間 $[l, l + 2^k - 1]$ は位置 $l$ から $2^k$ 要素をカバー
- 第2区間 $[r - 2^k + 1, r]$ は位置 $r$ まで $2^k$ 要素をカバー

第1区間の右端: $l + 2^k - 1$。第2区間の左端: $r - 2^k + 1 = l + L - 2^k$。$2^k \leq L$ より $L - 2^k \leq L - 1$ だから $r - 2^k + 1 \leq l + 2^k - 1$ (2つの区間は重なるか接する)。よって $[l, r]$ 全体がカバーされる。 $\square$

## Sparse Table が使える演算

Sparse Table の $O(1)$ クエリは**冪等性**を利用しているため、冪等な演算にしか使えない:

- $\min$ (RMQ)
- $\max$
- $\gcd$
- ビット OR
- ビット AND

加算のように冪等でない演算には使えない (重複部分が二重に数えられるため)。加算の場合は Disjoint Sparse Table を使う。

## 完全な実装

```python title="sparse_table.py"
import math

class SparseTable:
    def __init__(self, arr):
        self.n = len(arr)
        self.K = int(math.log2(self.n)) + 1 if self.n > 0 else 0
        self.table = [[0] * self.n for _ in range(self.K)]
        self.table[0] = list(arr)
        for k in range(1, self.K):
            for i in range(self.n - (1 << k) + 1):
                self.table[k][i] = min(
                    self.table[k-1][i],
                    self.table[k-1][i + (1 << (k-1))]
                )
        self.log = [0] * (self.n + 1)
        for i in range(2, self.n + 1):
            self.log[i] = self.log[i // 2] + 1

    def query(self, l, r):
        k = self.log[r - l + 1]
        return min(self.table[k][l], self.table[k][r - (1 << k) + 1])
```

## まとめ

| 項目 | 内容 |
|------|------|
| 構築 | $O(n \log n)$ |
| クエリ | $O(1)$ |
| 空間 | $O(n \log n)$ |
| 条件 | 静的配列、冪等な演算 |
| 核心 | 冪乗長の区間を前処理し、2 つの重なる区間で覆う |
| 応用 | RMQ、LCA (Euler Tour + RMQ) |
