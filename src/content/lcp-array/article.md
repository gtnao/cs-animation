---
title: "LCP Array (Kasai) 解説"
---

## LCP Array とは

LCP Array (Longest Common Prefix Array, 最長共通接頭辞配列) は、Suffix Array の隣接する2つの接尾辞間の最長共通接頭辞の長さを記録した配列である。

### 定義

Suffix Array $\text{SA}$ が与えられたとき、LCP Array $\text{LCP}[0..n-1]$ を以下のように定義する。

$$
\text{LCP}[i] = \text{lcp}(S[\text{SA}[i-1]..], S[\text{SA}[i]..]) \quad (i \geq 1)
$$

$$
\text{LCP}[0] = 0
$$

ここで $\text{lcp}(x, y)$ は文字列 $x$ と $y$ の最長共通接頭辞の長さである。

### 具体例

文字列 `banana$` の場合:

| Rank | SA | LCP | Suffix |
|------|-----|-----|--------|
| 0 | 6 | 0 | `$` |
| 1 | 5 | 0 | `a$` |
| 2 | 3 | 1 | `ana$` |
| 3 | 1 | 3 | `anana$` |
| 4 | 0 | 0 | `banana$` |
| 5 | 4 | 0 | `na$` |
| 6 | 2 | 2 | `nana$` |

## Kasai のアルゴリズム

### 核心アイデア

素朴にLCP配列を計算すると $O(n^2)$ かかるが、Kasai のアルゴリズムは次の性質を利用して $O(n)$ で計算する。

**重要な性質:** テキスト位置 $i$ に対する LCP 値を $h$ とすると、位置 $i+1$ に対する LCP 値は $h - 1$ 以上である。

### なぜこの性質が成り立つか

位置 $i$ の接尾辞 $S[i..]$ と、SA上で直前の接尾辞 $S[j..]$ の LCP が $h$ であるとする。つまり $S[i..i+h-1] = S[j..j+h-1]$ かつ $S[i+h] \neq S[j+h]$ (あるいは一方が文字列末端)。

このとき $S[i+1..i+h-1] = S[j+1..j+h-1]$ であり、位置 $i+1$ の接尾辞 $S[i+1..]$ と位置 $j+1$ の接尾辞 $S[j+1..]$ は少なくとも $h-1$ 文字一致する。

SA上で $S[i+1..]$ の直前の接尾辞は $S[j+1..]$ と同じかそれ以上の一致を持つ (SA上でより近い接尾辞との LCP は、遠い接尾辞との LCP 以上)。

### 実装

```python title="kasai.py"
def kasai(s: str, sa: list[int]) -> list[int]:
    n = len(s)
    rank = [0] * n
    for i in range(n):
        rank[sa[i]] = i
    lcp = [0] * n
    h = 0
    for i in range(n):
        if rank[i] > 0:
            j = sa[rank[i] - 1]
            while i + h < n and j + h < n and s[i + h] == s[j + h]:
                h += 1
            lcp[rank[i]] = h
            if h > 0:
                h -= 1
        else:
            h = 0
    return lcp
```

## 計算量の証明

### 命題: Kasai のアルゴリズムは $O(n)$

**証明:**

変数 $h$ に注目する。外側の for ループの各反復で:

- $h$ は while ループで増加する
- ループ終了後に $h$ が 1 減少する ($h > 0$ のとき)

$h$ の初期値は 0 であり、非負を保つ。$h$ が減少するのは各 $i$ について高々1回 (1だけ)。減少の総量は高々 $n$。

$h$ の増加量の合計 = $h$ の減少量の合計 + 最終値 $\leq n + n = 2n$。

したがって while ループの総反復回数は $O(n)$ であり、全体の計算量は $O(n)$。 $\square$

## 応用

### 最長重複部分文字列

LCP配列の最大値が最長重複部分文字列の長さを与える。

### 異なる部分文字列の数

長さ $n$ の文字列の異なる部分文字列の数は以下で求められる。

$$
\frac{n(n+1)}{2} - \sum_{i=1}^{n-1} \text{LCP}[i]
$$

### LCP クエリ

任意の2つの接尾辞 $\text{SA}[i]$ と $\text{SA}[j]$ の LCP は、$\text{LCP}[i+1..j]$ の最小値として求められる。これは Range Minimum Query (RMQ) で $O(1)$ に前計算できる。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 文字列 $S$ (長さ $n$) と Suffix Array |
| 出力 | LCP Array |
| 時間計算量 | $O(n)$ |
| 空間計算量 | $O(n)$ |
| 核心 | 前の LCP 値 $-1$ を下界として再利用 |
