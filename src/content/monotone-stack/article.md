---
title: "Monotone Stack 解説"
---

## Monotone Stack とは

Monotone Stack (単調スタック) は、スタック内の要素が常に単調増加 (または単調減少) になるように管理するデータ構造である。各要素の **Next Greater Element (NGE)** や **Next Smaller Element (NSE)** を $O(n)$ で求められる。

## 問題: Next Greater Element

配列 $A$ の各要素 $A[i]$ に対して、$A[i]$ より大きい最初の右側の要素のインデックスを求めよ。

## アルゴリズム

```python title="monotone_stack.py"
def next_greater_element(a: list[int]) -> list[int]:
    n = len(a)
    nge = [-1] * n
    stack = []
    for i in range(n):
        while stack and a[stack[-1]] < a[i]:
            nge[stack.pop()] = i
        stack.append(i)
    return nge
```

### 動作原理

スタックには「まだ NGE が見つかっていない」要素のインデックスを保持する。新しい要素 $A[i]$ がスタックの先頭より大きければ、それが NGE となる。

## 計算量

各要素は高々1回 push され、高々1回 pop されるため:

$$
T(n) = O(n)
$$

## 応用

- **ヒストグラム中の最大長方形**: NSE を使って各棒の左右の境界を決定
- **Stock Span Problem**: 株価が現在以下だった連続日数
- **Cartesian Tree の構築**: 単調スタックで線形時間構築

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $n$ の配列 |
| 出力 | 各要素の NGE/NSE |
| 時間計算量 | $O(n)$ |
| 空間計算量 | $O(n)$ |
