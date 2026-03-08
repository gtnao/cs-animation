---
title: "Heap Sort 解説"
---

## Heap Sort とは

Heap Sort (ヒープソート) は、**二分ヒープ** (Binary Heap) データ構造を利用して配列を整列するソートアルゴリズムである。最大ヒープを構築し、最大要素を順に取り出すことでソートを実現する。

## 前提知識：二分ヒープ

### 定義

二分ヒープは完全二分木であり、以下のヒープ条件を満たす:

- **最大ヒープ:** 各ノードの値はその子ノードの値以上
- **最小ヒープ:** 各ノードの値はその子ノードの値以下

### 配列による表現

完全二分木は配列で効率的に表現できる。インデックス $i$ のノードに対して:

- 親: $\lfloor (i - 1) / 2 \rfloor$
- 左の子: $2i + 1$
- 右の子: $2i + 2$

## アルゴリズムの概要

### 2 つのフェーズ

1. **ヒープ構築フェーズ:** 配列を最大ヒープに変換する
2. **抽出フェーズ:** 最大要素を末尾と交換し、ヒープサイズを縮小してヒープ条件を修復する

### sift-down 操作

sift-down (下方移動) は、ノードをヒープ条件を満たすまで下方に移動させる操作である。

1. ノードと左右の子を比較する
2. 子の方が大きければ、最大の子と交換する
3. 交換が発生したら、交換先で再帰的に sift-down する

## 実装

```python title="heap_sort.py"
def heap_sort(a: list[int]) -> list[int]:
    n = len(a)

    # Build max-heap (bottom-up)
    for i in range(n // 2 - 1, -1, -1):
        sift_down(a, n, i)

    # Extract elements one by one
    for i in range(n - 1, 0, -1):
        a[0], a[i] = a[i], a[0]
        sift_down(a, i, 0)

    return a

def sift_down(a: list[int], size: int, i: int):
    largest = i
    left = 2 * i + 1
    right = 2 * i + 2

    if left < size and a[left] > a[largest]:
        largest = left
    if right < size and a[right] > a[largest]:
        largest = right

    if largest != i:
        a[i], a[largest] = a[largest], a[i]
        sift_down(a, size, largest)
```

## 計算量

| ケース | 時間計算量 | 説明 |
|--------|-----------|------|
| 最良 | $O(n \log n)$ | |
| 平均 | $O(n \log n)$ | |
| 最悪 | $O(n \log n)$ | |

**空間計算量:** $O(1)$ (in-place)

### ヒープ構築の計算量

ボトムアップでヒープを構築する場合、計算量は $O(n)$ である。高さ $h$ のノードの sift-down は $O(h)$ であり、高さ $h$ のノード数は高々 $\lceil n / 2^{h+1} \rceil$ 個であるから:

$$
\sum_{h=0}^{\lfloor \log n \rfloor} \left\lceil \frac{n}{2^{h+1}} \right\rceil \cdot O(h) = O\left(n \sum_{h=0}^{\infty} \frac{h}{2^h}\right) = O(n)
$$

### 抽出フェーズの計算量

$n - 1$ 回の抽出があり、各抽出で $O(\log n)$ の sift-down を行うので:

$$
(n-1) \cdot O(\log n) = O(n \log n)
$$

## 安定性

Heap Sort は**不安定ソート**である。ヒープ操作中に等しい要素の相対順序が変わる可能性がある。

## 特徴と応用

### 長所

- 最悪計算量が $O(n \log n)$ で保証される
- in-place (追加メモリ $O(1)$)
- Quick Sort のような最悪ケース退化がない

### 短所

- キャッシュ効率が悪い (配列の離れた要素にアクセス)
- 実用上 Quick Sort より遅いことが多い
- 不安定ソート

### 応用場面

- 最悪計算量の保証が必要な場合
- メモリ制約が厳しい場合
- 優先度付きキューの実装
- Intro Sort の最悪ケースフォールバック

## まとめ

| 項目 | 内容 |
|------|------|
| 時間計算量 (最良/平均/最悪) | $O(n \log n)$ / $O(n \log n)$ / $O(n \log n)$ |
| 空間計算量 | $O(1)$ |
| 安定性 | 不安定 |
| in-place | はい |
| 手法 | 二分ヒープによる最大値の反復抽出 |
