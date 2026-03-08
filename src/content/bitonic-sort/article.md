---
title: "Bitonic Sort 解説"
---

## Bitonic Sort とは

Bitonic Sort (バイトニックソート) は、Ken Batcher が 1968 年に提案した**ソーティングネットワーク**に基づくソートアルゴリズムである。比較のパターンが入力に依存しないため、並列計算に非常に適している。

## 前提知識：バイトニック列

### 定義

**バイトニック列** (Bitonic Sequence) とは、ある位置まで単調増加し、そこから単調減少する列のことである。循環的なシフトを含む場合も含む。

$$
a_0 \leq a_1 \leq \cdots \leq a_k \geq a_{k+1} \geq \cdots \geq a_{n-1}
$$

例:
- `[1, 3, 5, 7, 6, 4, 2]` はバイトニック列
- `[5, 7, 6, 4, 2, 1, 3]` もバイトニック列 (循環シフト)

### バイトニック列のマージ

バイトニック列を昇順にソートする操作を**バイトニックマージ**という。長さ $n$ のバイトニック列に対して、距離 $n/2$ の要素ペアを比較・交換すると、前半と後半がそれぞれバイトニック列になり、前半の全要素が後半の全要素以下になる。これを再帰的に適用すればソートが完了する。

## アルゴリズムの概要

### 手順

1. 長さ 2 の部分列をバイトニック列にする (昇順と降順のペア)
2. バイトニックマージで長さ 4 のソート済み列を作る
3. 繰り返して列の長さを倍増させていく
4. 最終的に全体がソート済みになる

### 制約

入力の長さが 2 の冪乗でない場合は、パディングが必要になる。

## 実装

```python title="bitonic_sort.py"
def bitonic_sort(a: list[int]) -> list[int]:
    # Pad to next power of 2
    n = 1
    while n < len(a):
        n *= 2
    a = a + [float('inf')] * (n - len(a))

    _bitonic_sort(a, 0, n, True)
    return a[:len(a)]

def _bitonic_sort(a: list[int], lo: int, cnt: int, ascending: bool):
    if cnt <= 1:
        return
    k = cnt // 2
    _bitonic_sort(a, lo, k, True)         # Sort first half ascending
    _bitonic_sort(a, lo + k, k, False)    # Sort second half descending
    _bitonic_merge(a, lo, cnt, ascending)  # Merge the bitonic sequence

def _bitonic_merge(a: list[int], lo: int, cnt: int, ascending: bool):
    if cnt <= 1:
        return
    k = cnt // 2
    for i in range(lo, lo + k):
        if (a[i] > a[i + k]) == ascending:
            a[i], a[i + k] = a[i + k], a[i]
    _bitonic_merge(a, lo, k, ascending)
    _bitonic_merge(a, lo + k, k, ascending)
```

## 計算量

| ケース | 時間計算量 (逐次) | 並列時間計算量 |
|--------|-------------------|---------------|
| 全ケース | $O(n \log^2 n)$ | $O(\log^2 n)$ |

**空間計算量:** $O(1)$ (in-place) + パディング分

### 計算量の導出

バイトニックソートは $\log n$ ステージからなり、各ステージは $O(\log n)$ レベルの比較・交換で構成される。各レベルでは $O(n)$ の比較が行われるため、逐次計算量は:

$$
O(n \log^2 n)
$$

並列実行では各レベルの $O(n)$ 比較を同時に行えるため、並列時間計算量は:

$$
O(\log^2 n)
$$

## ソーティングネットワーク

Bitonic Sort は**ソーティングネットワーク**の一種である。ソーティングネットワークとは、入力に依存しない固定的な比較パターンでソートを行う手法であり、ハードウェア実装に適している。

比較器の総数は:

$$
\frac{n \log^2 n}{2} = O(n \log^2 n)
$$

## 安定性

Bitonic Sort は**不安定ソート**である。

## 特徴と応用

### 長所

- 高い並列性 ($O(\log^2 n)$ の並列時間)
- 比較パターンが入力に依存しない (ソーティングネットワーク)
- ハードウェア実装に適している
- GPU ソートに適している

### 短所

- 逐次実行では $O(n \log^2 n)$ で、$O(n \log n)$ のソートより遅い
- 入力サイズが 2 の冪乗である必要がある
- 不安定ソート

### 応用場面

- GPU 上での並列ソート (CUDA, OpenCL)
- FPGA によるハードウェアソート
- 並列コンピューティング

## まとめ

| 項目 | 内容 |
|------|------|
| 時間計算量 (逐次) | $O(n \log^2 n)$ |
| 並列時間計算量 | $O(\log^2 n)$ |
| 空間計算量 | $O(1)$ |
| 安定性 | 不安定 |
| in-place | はい |
| 手法 | ソーティングネットワーク |
