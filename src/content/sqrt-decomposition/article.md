---
title: "平方分割 解説"
---

## 平方分割とは

平方分割 (Sqrt Decomposition) は、配列を $\sqrt{n}$ 個のブロックに分割し、各ブロックの情報を事前計算しておくことで、区間クエリを $O(\sqrt{n})$ で処理する手法である。

セグメント木ほど高速ではないが、**実装が非常にシンプル**であり、セグメント木では扱いにくい問題にも適用できることが多い。

### 計算量

| 操作 | 時間計算量 |
|------|-----------|
| 構築 | $O(n)$ |
| 区間クエリ | $O(\sqrt{n})$ |
| 一点更新 | $O(1)$ |
| 空間計算量 | $O(n)$ |

## 基本構造

### ブロック分割

長さ $n$ の配列 $a$ を、サイズ $B = \lfloor \sqrt{n} \rfloor$ のブロックに分割する。ブロック数は $\lceil n / B \rceil$ 個になる。

各ブロック $k$ は区間 $[kB, \min((k+1)B - 1, n-1)]$ を担当する。

### 前処理

各ブロックについて、区間の合計 (または最小値、最大値等) を事前に計算しておく。

```python title="sqrt_build.py"
import math

def build(arr):
    n = len(arr)
    B = max(1, int(math.sqrt(n)))
    num_blocks = (n + B - 1) // B
    blocks = [0] * num_blocks
    for i in range(n):
        blocks[i // B] += arr[i]
    return blocks, B
```

## 区間クエリ

区間 $[l, r]$ のクエリを処理する際、区間を 3 つの部分に分解する:

1. **左端の端数**: $l$ から次のブロック境界まで (要素ごとに処理)
2. **完全なブロック**: 区間に完全に含まれるブロック (ブロックの前処理値を使用)
3. **右端の端数**: 最後のブロック境界から $r$ まで (要素ごとに処理)

```python title="sqrt_query.py"
def query(arr, blocks, B, l, r):
    s = 0
    block_l = l // B
    block_r = r // B
    if block_l == block_r:
        # Same block
        for i in range(l, r + 1):
            s += arr[i]
    else:
        # Left partial
        for i in range(l, (block_l + 1) * B):
            s += arr[i]
        # Full blocks
        for b in range(block_l + 1, block_r):
            s += blocks[b]
        # Right partial
        for i in range(block_r * B, r + 1):
            s += arr[i]
    return s
```

### 計算量の証明

**命題**: 区間クエリの時間計算量は $O(\sqrt{n})$。

**証明**: $B = \sqrt{n}$ とする。

- 左端の端数: 高々 $B - 1 = O(\sqrt{n})$ 要素
- 完全なブロック: 高々 $\lceil n/B \rceil = O(\sqrt{n})$ ブロック
- 右端の端数: 高々 $B - 1 = O(\sqrt{n})$ 要素

合計 $O(\sqrt{n})$ である。 $\square$

## 一点更新

位置 $i$ の値を変更するとき:

1. `arr[i]` を更新
2. `blocks[i // B]` を再計算 ($O(B)$ または差分更新で $O(1)$)

```python title="sqrt_update.py"
def update(arr, blocks, B, i, val):
    blocks[i // B] -= arr[i]
    arr[i] = val
    blocks[i // B] += val
```

## 最適なブロックサイズ

区間クエリのコストを最小化するブロックサイズを求める。

- 端数の処理: $O(B)$
- 完全ブロックの処理: $O(n / B)$
- 合計: $O(B + n/B)$

$B + n/B$ を最小化するには、AM-GM 不等式より $B = \sqrt{n}$ が最適であり、コストは $O(\sqrt{n})$ になる。

## 応用

### 区間加算 + 一点取得

全ブロックに「加算オフセット」を持たせる。区間加算の際、完全に含まれるブロックにはオフセットのみ更新し、端数は直接更新する。

### 区間加算 + 区間最小値

各ブロックの最小値とオフセットを管理する。完全ブロックにはオフセット更新、端数はブロック内の最小値を再計算する。

### 要素の挿入・削除

平方分割は配列ベースなので、挿入・削除にも対応しやすい。各ブロックを可変長配列にすれば、$O(\sqrt{n})$ で挿入・削除ができる。

## セグメント木との比較

| 特性 | 平方分割 | セグメント木 |
|------|---------|------------|
| クエリ計算量 | $O(\sqrt{n})$ | $O(\log n)$ |
| 実装の簡単さ | 非常に簡単 | やや複雑 |
| 柔軟性 | 高い | 中程度 |
| 定数倍 | 小さい | やや大きい |

## まとめ

| 項目 | 内容 |
|------|------|
| 構築 | $O(n)$ |
| 区間クエリ | $O(\sqrt{n})$ |
| 一点更新 | $O(1)$ |
| 核心 | 配列を $\sqrt{n}$ ブロックに分割 |
| 利点 | 実装が簡潔、柔軟性が高い |
| 制約 | セグメント木より遅い |
