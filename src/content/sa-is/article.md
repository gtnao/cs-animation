---
title: "SA-IS 解説"
---

## SA-IS とは

SA-IS (Suffix Array by Induced Sorting) は、2009年に Nong, Zhang, Chan によって提案された Suffix Array の**線形時間** $O(n)$ 構築アルゴリズムである。

誘導ソート (induced sorting) の技法を用いて、LMS (Leftmost S-type) 接尾辞の順序から全接尾辞の順序を復元する。

## 準備: S型・L型の分類

### 定義

文字列 $S$ の各位置 $i$ を以下のように分類する。

- **S型 (Smaller):** $S[i..] < S[i+1..]$ (辞書順で接尾辞が次の位置より小さい)
- **L型 (Larger):** $S[i..] > S[i+1..]$

最後の文字 (番兵 $\$$) はS型とする。

### 判定方法

右から左に走査して判定する。

$$
\text{type}(i) = \begin{cases}
\text{S} & \text{if } S[i] < S[i+1] \\
\text{L} & \text{if } S[i] > S[i+1] \\
\text{type}(i+1) & \text{if } S[i] = S[i+1]
\end{cases}
$$

### LMS (Leftmost S-type)

位置 $i$ が **LMS** であるとは、$i > 0$ かつ $\text{type}(i) = \text{S}$ かつ $\text{type}(i-1) = \text{L}$ であることをいう。つまりL型からS型に変わる境界位置である。

## アルゴリズムの概要

SA-IS は以下の手順で動作する。

### Step 1: 型分類

全位置をS型/L型に分類し、LMS位置を特定する。

### Step 2: LMS接尾辞の仮ソート

LMS接尾辞をバケットの末尾に配置する (この時点では正しい順序ではない)。

### Step 3: L型接尾辞の誘導

左から右に走査し、$\text{SA}[i] - 1$ がL型ならバケットの先頭に配置する。

**なぜこれで正しいか:** L型接尾辞 $S[j..]$ の順序は $S[j+1..]$ の順序から誘導できる。$S[j] = S[j']$ のとき、$S[j..] < S[j'..]$ ならば $S[j+1..] < S[j'+1..]$ (L型の性質から)。

### Step 4: S型接尾辞の誘導

右から左に走査し、$\text{SA}[i] - 1$ がS型ならバケットの末尾に配置する。

### 再帰呼び出し

LMS部分文字列が一意でない場合、LMS部分文字列にランクを付けて新しい文字列を作り、再帰的にSA-ISを適用する。

## 計算量

### 命題: SA-IS の計算量は $O(n)$

**証明の概要:**

各ステップ (型分類、バケットソート、L型誘導、S型誘導) は $O(n)$ で実行できる。

再帰呼び出しの入力サイズはLMS位置の数であり、これは高々 $n/2$ である (L型とS型が交互に現れるため、連続する2位置のうちLMSは高々1つ)。

したがって計算量 $T(n)$ は以下を満たす。

$$
T(n) = T(n/2) + O(n)
$$

マスター定理 (または等比級数の和) により $T(n) = O(n)$。 $\square$

## 具体例

文字列 `mmiissiissiippii$` で SA-IS を実行する。

1. **型分類:** `L L S S L L S S L L S S L L S S S`
2. **LMS位置:** 2, 6, 10, 14, 16
3. **LMS接尾辞をバケット末尾に配置**
4. **L型を誘導ソート**
5. **S型を誘導ソート**

## 実装のポイント

- 番兵文字 $\$$ は全文字より小さいとする
- バケットの境界は文字の出現頻度から $O(n)$ で計算できる
- 再帰は入力サイズが十分小さくなったら素朴な方法に切り替えてもよい

```python title="sa_is_outline.py"
def sa_is(s: list[int], alphabet_size: int) -> list[int]:
    n = len(s)
    if n <= 2:
        # base case
        return sorted(range(n), key=lambda i: s[i:])

    # Step 1: classify types
    types = classify(s)
    lms = find_lms(types)

    # Step 2: initial placement of LMS
    sa = bucket_sort_lms(s, lms, alphabet_size)

    # Step 3: induce L-type
    induce_l(s, sa, types, alphabet_size)

    # Step 4: induce S-type
    induce_s(s, sa, types, alphabet_size)

    # Check if LMS substrings are unique
    # If not, recurse on reduced string
    # ...

    return sa
```

## 他の線形時間アルゴリズムとの比較

| アルゴリズム | 計算量 | 特徴 |
|-------------|--------|------|
| SA-IS | $O(n)$ | 実装が比較的簡潔、実用上高速 |
| DC3/Skew | $O(n)$ | 理論的にシンプル、定数が大きい |
| KA (Ko-Aluru) | $O(n)$ | SA-ISの前身 |

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $n$ の文字列 |
| 出力 | Suffix Array |
| 時間計算量 | $O(n)$ |
| 空間計算量 | $O(n)$ |
| 核心 | LMS接尾辞から全接尾辞の順序を誘導 |
| 再帰 | 入力サイズが半減 → 全体 $O(n)$ |
