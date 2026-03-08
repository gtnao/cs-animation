---
title: "Burrows-Wheeler Transform 解説"
---

## Burrows-Wheeler Transform とは

Burrows-Wheeler Transform (BWT) は、1994年に Michael Burrows と David Wheeler によって提案された**可逆な文字列変換**である。

BWT はデータ圧縮の前処理として使われ、同じ文字が連続して現れやすいように文字列を並べ替える。bzip2 などの圧縮ツールで実用されている。

## 変換手順

### 順変換

文字列 $S$ (末尾に番兵 $\$$ を付加) に対して:

1. $S$ の全ての巡回シフト (cyclic rotation) を生成
2. 辞書順にソート
3. 各行の最後の文字を取り出す → これが BWT

### 具体例

文字列 `banana$` の BWT を求める。

巡回シフトをソートした行列:

| 行 | 巡回シフト | 最終文字 |
|----|-----------|---------|
| 0 | `$banana` | `a` |
| 1 | `a$banan` | `n` |
| 2 | `ana$ban` | `n` |
| 3 | `anana$b` | `b` |
| 4 | `banana$` | `$` |
| 5 | `na$bana` | `a` |
| 6 | `nana$ba` | `a` |

BWT = `annb$aa`

### Suffix Array との関係

BWT の各文字は Suffix Array を使って求められる。

$$
\text{BWT}[i] = S[\text{SA}[i] - 1] \quad (\text{SA}[i] > 0)
$$

$$
\text{BWT}[i] = S[n - 1] \quad (\text{SA}[i] = 0)
$$

## 逆変換

BWT は可逆変換である。出力文字列 $L$ (Last column) と元の文字列の位置 $I$ から元の文字列を復元できる。

### LF-mapping

最終列 $L$ をソートすると最初列 $F$ が得られる。$L$ の $i$ 番目の文字と $F$ の $j$ 番目の文字の対応関係 (LF-mapping) を使って逆変換する。

```python title="inverse_bwt.py"
def inverse_bwt(bwt: str, original_index: int) -> str:
    n = len(bwt)
    # Build first column by sorting
    first = sorted(range(n), key=lambda i: bwt[i])
    # Build LF-mapping
    lf = [0] * n
    count = {}
    for i in range(n):
        c = bwt[i]
        count[c] = count.get(c, 0)
        lf[i] = count[c]
        count[c] += 1

    # Count occurrences for first column offset
    freq = {}
    for c in bwt:
        freq[c] = freq.get(c, 0) + 1
    offset = {}
    pos = 0
    for c in sorted(freq):
        offset[c] = pos
        pos += freq[c]

    # Reconstruct
    result = []
    idx = original_index
    for _ in range(n):
        result.append(bwt[idx])
        idx = offset[bwt[idx]] + lf[idx]

    return "".join(reversed(result))
```

## なぜ圧縮に有効か

BWT は同じ文字の出現を近くに集める傾向がある。

例えば `banana$` → `annb$aa` のように、`a` や `n` が連続する。これは後続の Run-Length Encoding や Move-to-Front 変換と組み合わせることで、圧縮率を大幅に改善する。

**直感的な理由:** 辞書順でソートすると、同じ文脈 (接尾辞の先頭が同じ) を持つ位置が隣接する。文脈が同じなら、その直前の文字も同じになりやすい。BWT はまさにその「直前の文字」を取り出しているため、同じ文字が集まる。

## 計算量

| 操作 | 計算量 |
|------|--------|
| 順変換 (SA使用) | $O(n)$ |
| 逆変換 | $O(n)$ |
| 空間 | $O(n)$ |

## FM-Index

BWT を基盤とする全文検索インデックスが **FM-Index** である。BWT + 補助データ構造で $O(\|P\|)$ のパターン検索が可能。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $n$ の文字列 $S$ |
| 出力 | BWT文字列 + 元の位置 |
| 変換 | $O(n)$ (SA利用時) |
| 逆変換 | $O(n)$ |
| 核心 | 巡回シフトのソートで同文字を集約 |
| 応用 | bzip2, FM-Index, 全文検索 |
