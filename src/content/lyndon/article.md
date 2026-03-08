---
title: "Lyndon Factorization 解説"
---

## Lyndon 分解とは

Lyndon 分解は、任意の文字列を **Lyndon語** の辞書順非増加列に一意に分解する手法である。

### Lyndon 語の定義

文字列 $w$ が **Lyndon語** であるとは、$w$ が自身の全ての真の巡回シフトより辞書順で厳密に小さいことをいう。

同値な定義: $w$ が自身の全ての真の接尾辞より辞書順で厳密に小さい。

### 具体例

- `a`, `b`, `ab`, `aab`, `abb`, `abc` は Lyndon語
- `ba`, `aa`, `abab` は Lyndon語ではない

### Chen-Fox-Lyndon の定理

任意の文字列 $S$ は Lyndon語 $w_1, w_2, \ldots, w_k$ の連結として一意に表せる。ただし $w_1 \geq w_2 \geq \cdots \geq w_k$ (辞書順)。

$$
S = w_1 w_2 \cdots w_k, \quad w_1 \geq w_2 \geq \cdots \geq w_k
$$

## Duval のアルゴリズム

Duval のアルゴリズムは Lyndon分解を $O(n)$ 時間、$O(1)$ 追加空間で求める。

### アルゴリズムの概要

3つのポインタ $i, j, k$ を管理する。

- $i$: 現在処理中のブロックの先頭
- $j$: 周期の現在位置 ($j \geq i$)
- $k$: 比較する位置 ($k > j$)

### 処理

```python title="duval.py"
def lyndon_factorization(s: str) -> list[str]:
    n = len(s)
    factorization = []
    i = 0
    while i < n:
        j = i
        k = i + 1
        while k < n and s[j] <= s[k]:
            if s[j] < s[k]:
                j = i  # reset j
            else:
                j += 1  # s[j] == s[k]
            k += 1
        # Output Lyndon words
        period = k - j
        while i + period <= k:
            factorization.append(s[i:i + period])
            i += period
    return factorization
```

### 動作原理

1. $s[j] < s[k]$: 現在の部分文字列はまだ Lyndon語として拡張可能。$j$ を先頭にリセット
2. $s[j] = s[k]$: 周期的なパターンが続いている。$j$ と $k$ を同時に進める
3. $s[j] > s[k]$: 切れ目を検出。周期 $k - j$ の Lyndon語を出力

## 計算量

### 命題: Duval のアルゴリズムは $O(n)$ 時間、$O(1)$ 追加空間

**証明の概要:**

ポインタ $k$ は常に増加する。$k$ が $n$ 未満の間ループが続き、$s[j] > s[k]$ のときに $i$ が進む。$i$ の増加量の合計は $n$ であるから、外側の while ループの反復回数も $O(n)$。

## 具体例

文字列 `abbaabbaac` の Lyndon分解を求める。

1. `abb` は Lyndon語 ($b$ で辞書順の限界が来る)
2. `aabb` は Lyndon語
3. `aac` は Lyndon語

分解: `abb | aabb | aac`

$\text{abb} \geq \text{aabb} \geq \text{aac}$ (辞書順) を確認できる。

## 応用

1. **最小巡回シフト:** Lyndon分解の最後の語の末尾が最小巡回シフトの開始位置 (Booth のアルゴリズムと関連)
2. **辞書順最小の接尾辞:** Lyndon分解から効率的に求められる
3. **Lyndon Array:** Suffix Array と Lyndon分解の組み合わせで文字列の構造を分析

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $n$ の文字列 |
| 出力 | Lyndon語の非増加列 |
| 時間計算量 | $O(n)$ |
| 空間計算量 | $O(1)$ (追加) |
| 核心 | 3ポインタによる周期検出と分解 |
