---
title: "Bucket Sort 解説"
---

## Bucket Sort とは

Bucket Sort (バケットソート) は、要素を複数のバケット (区間) に分配し、各バケットを個別にソートした後、連結して全体を整列するソートアルゴリズムである。入力が一様分布に従う場合に平均 $O(n)$ で動作する。

## アルゴリズムの概要

### 手順

1. **バケットの作成:** $n$ 個のバケットを用意する
2. **分配:** 各要素を値に基づいて適切なバケットに割り振る
3. **個別ソート:** 各バケット内を個別にソートする (通常 Insertion Sort)
4. **連結:** 全バケットを順に連結して結果を得る

### 具体例

配列 `[0.42, 0.32, 0.33, 0.52, 0.37, 0.47, 0.51, 0.22]` を 5 バケットでソートする:

**分配:**
- バケット 0 [0.0, 0.2): (empty)
- バケット 1 [0.2, 0.4): 0.32, 0.33, 0.37, 0.22
- バケット 2 [0.4, 0.6): 0.42, 0.52, 0.47, 0.51
- バケット 3 [0.6, 0.8): (empty)
- バケット 4 [0.8, 1.0): (empty)

**個別ソート:**
- バケット 1: 0.22, 0.32, 0.33, 0.37
- バケット 2: 0.42, 0.47, 0.51, 0.52

**連結:**
`[0.22, 0.32, 0.33, 0.37, 0.42, 0.47, 0.51, 0.52]`

## 実装

```python title="bucket_sort.py"
def bucket_sort(a: list[float], num_buckets: int = 10) -> list[float]:
    if not a:
        return a
    n = len(a)
    max_val = max(a)

    # Create buckets
    buckets: list[list[float]] = [[] for _ in range(num_buckets)]

    # Distribute elements into buckets
    for x in a:
        idx = min(int(x / (max_val + 1) * num_buckets), num_buckets - 1)
        buckets[idx].append(x)

    # Sort each bucket (using insertion sort)
    for bucket in buckets:
        insertion_sort(bucket)

    # Concatenate buckets
    result = []
    for bucket in buckets:
        result.extend(bucket)
    return result

def insertion_sort(a: list[float]):
    for i in range(1, len(a)):
        key = a[i]
        j = i - 1
        while j >= 0 and a[j] > key:
            a[j + 1] = a[j]
            j -= 1
        a[j + 1] = key
```

## 計算量

| ケース | 時間計算量 | 説明 |
|--------|-----------|------|
| 最良 | $O(n + k)$ | 均等に分配される場合 |
| 平均 | $O(n + n^2/k + k)$ | 一様分布の場合 $k = n$ で $O(n)$ |
| 最悪 | $O(n^2)$ | 全要素が同一バケットに入る場合 |

**空間計算量:** $O(n + k)$

### 平均計算量の導出

入力が $[0, 1)$ の一様分布に従い、$k = n$ 個のバケットを使う場合を考える。

各バケットに入る要素数の期待値は $n / k = 1$ であり、各バケットの Insertion Sort の期待コストは $O(1)$ である。

全バケットの合計コストは:

$$
E\left[\sum_{i=0}^{n-1} O(n_i^2)\right] = O\left(\sum_{i=0}^{n-1} E[n_i^2]\right) = O\left(n \cdot (2 - \frac{1}{n})\right) = O(n)
$$

ここで $n_i$ はバケット $i$ の要素数、$E[n_i^2] = 2 - 1/n$ は二項分布の性質から導かれる。

## 安定性

Bucket Sort は、バケット内のソートに安定ソートを使用する場合、**安定ソート**となる。

## 特徴と応用

### 長所

- 一様分布の入力に対して平均 $O(n)$
- 並列化しやすい (各バケットを独立にソート可能)

### 短所

- 分布が偏ると性能が劣化
- 追加メモリが必要
- バケット数の選択が性能に影響

### 応用場面

- 浮動小数点数のソート
- 値が一様に分布することがわかっている場合
- 外部ソートの一手法

## まとめ

| 項目 | 内容 |
|------|------|
| 時間計算量 (最良/平均/最悪) | $O(n + k)$ / $O(n)$ ($k = n$) / $O(n^2)$ |
| 空間計算量 | $O(n + k)$ |
| 安定性 | 安定 (安定ソート使用時) |
| in-place | いいえ |
| 手法 | バケットへの分配と個別ソート |
