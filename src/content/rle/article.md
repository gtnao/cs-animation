---
title: "Run Length Encoding 解説"
---

## Run Length Encoding とは

Run Length Encoding (RLE, ランレングス符号化) は、連続する同一文字の繰り返し (ラン) をその文字と繰り返し回数のペアで表現する、最も基本的なデータ圧縮手法の一つである。

### 具体例

```
入力: aaabbbccdddddeef
出力: a3b3c2d5e2f1
```

## アルゴリズム

### エンコード

```python title="rle_encode.py"
def rle_encode(s: str) -> list[tuple[str, int]]:
    if not s:
        return []
    result = []
    i = 0
    while i < len(s):
        c = s[i]
        count = 1
        while i + count < len(s) and s[i + count] == c:
            count += 1
        result.append((c, count))
        i += count
    return result
```

### デコード

```python title="rle_decode.py"
def rle_decode(encoded: list[tuple[str, int]]) -> str:
    return "".join(c * n for c, n in encoded)
```

## 圧縮率

### 効果的なケース

RLE は同じ文字が長く連続する場合に効果的である。

- 画像のピクセルデータ (特にモノクロ画像)
- BWT の出力 (同じ文字が集まりやすい)
- ゲノム配列の特定の領域

### 非効果的なケース

同じ文字がほとんど連続しない場合、RLE はかえってデータを膨張させる。

例: `abcdef` → `a1b1c1d1e1f1` (6文字 → 12文字)

そのため実用上は、RLE で表現が長くなる場合はそのまま出力するなどの工夫を加える。

## BWT + RLE

BWT と RLE の組み合わせは強力である。BWT が同じ文字を集約した後に RLE を適用すると、高い圧縮率を達成できる。

```
"banana$" → BWT → "annb$aa" → RLE → "a1n2b1$1a2"
```

bzip2 のパイプラインは BWT → Move-to-Front → RLE → Huffman という構成になっている。

## 計算量

| 操作 | 計算量 |
|------|--------|
| エンコード | $O(n)$ |
| デコード | $O(n)$ (出力長) |
| 空間 | $O(n)$ |

## 変種

### ビットRLE

ビット列の場合、先頭ビットとラン長の列のみで表現できる。

### PackBits

Apple の PackBits 形式: ランと非ランを区別するフラグバイトを使う。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 文字列 (長さ $n$) |
| 出力 | (文字, 連続回数) のペアの列 |
| 時間計算量 | $O(n)$ |
| 核心 | 同一文字の連続を圧縮 |
| 有効な場合 | 長いランが多い場合 |
| 応用 | 画像圧縮, BWT の後処理 |
