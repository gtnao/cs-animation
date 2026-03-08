---
title: "ランレングス圧縮 解説"
---

## ランレングス圧縮とは

ランレングス圧縮 (Run-Length Encoding, RLE) は、連続する同一要素の並び (ラン) をその要素と出現回数のペアに置き換えるデータ圧縮手法である。

### 具体例

文字列 `aaabbbccddddee` を圧縮すると:

$$
\text{aaabbbccddddee} \rightarrow (a,3)(b,3)(c,2)(d,4)(e,2)
$$

### 定義

列 $S = s_0 s_1 \cdots s_{n-1}$ に対して、RLE は列 $(c_0, l_0), (c_1, l_1), \ldots, (c_{k-1}, l_{k-1})$ を出力する。ここで:

- $c_i$: $i$ 番目のランの文字
- $l_i$: $i$ 番目のランの長さ
- $c_i \neq c_{i+1}$ (隣接するランは異なる文字)
- $\sum_{i=0}^{k-1} l_i = n$

## アルゴリズム

```python title="rle.py"
def rle_encode(s: str) -> list[tuple[str, int]]:
    if not s:
        return []
    result = []
    current = s[0]
    count = 1
    for i in range(1, len(s)):
        if s[i] == current:
            count += 1
        else:
            result.append((current, count))
            current = s[i]
            count = 1
    result.append((current, count))
    return result

def rle_decode(encoded: list[tuple[str, int]]) -> str:
    return ''.join(c * n for c, n in encoded)
```

## 計算量

| 操作 | 計算量 |
|------|--------|
| 圧縮 | $O(n)$ |
| 展開 | $O(n)$ |
| 空間 | $O(k)$ ($k$ はランの数) |

## 圧縮率

最良ケース: 同一文字の繰り返し `aaaa...a` → 圧縮率 $O(1/n)$

最悪ケース: 全て異なる文字 `abcdef...` → 圧縮後の方が大きくなる (膨張)

RLE は**同一要素が長く連続するデータ** (画像のビットマップ、遺伝子配列など) に効果的である。

## 競技プログラミングでの応用

- **文字列操作の高速化**: 圧縮表現のまま操作すると、ランの数 $k$ に依存した計算量になる
- **繰り返しパターンの検出**: 圧縮後のパターンマッチング
- **二次元データの圧縮**: 行ごとに RLE を適用

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $n$ の列 |
| 出力 | (値, 長さ) のペア列 |
| 時間計算量 | $O(n)$ |
| 空間計算量 | $O(k)$ |
| 核心 | 連続する同一要素をまとめる |
