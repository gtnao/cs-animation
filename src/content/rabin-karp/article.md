---
title: "Rabin-Karp法 解説"
---

## Rabin-Karp法とは

Rabin-Karp法は、1987年に Rabin と Karp によって提案された確率的パターンマッチングアルゴリズムである。Rolling Hash を用いてテキスト中のパターンを検索する。

期待計算量は $O(n + m)$ であり、最悪の場合は $O(nm)$ だが、実用上は非常に高速である。

## アルゴリズム

### 概要

1. パターン $P$ のハッシュ値 $h_P$ を計算
2. テキスト $T$ の各位置 $i$ で、$T[i..i+m-1]$ のハッシュ値 $h_i$ を Rolling Hash で計算
3. $h_i = h_P$ なら文字列を実際に比較して一致を確認

### 実装

```python title="rabin_karp.py"
def rabin_karp(text: str, pattern: str, base: int = 256, mod: int = 101) -> list[int]:
    n, m = len(text), len(pattern)
    if m > n:
        return []

    # Compute base^(m-1) mod p
    h = pow(base, m - 1, mod)

    # Compute initial hashes
    p_hash = 0
    t_hash = 0
    for i in range(m):
        p_hash = (base * p_hash + ord(pattern[i])) % mod
        t_hash = (base * t_hash + ord(text[i])) % mod

    result = []
    for i in range(n - m + 1):
        if p_hash == t_hash:
            # Verify character by character
            if text[i:i+m] == pattern:
                result.append(i)

        # Compute next hash
        if i < n - m:
            t_hash = (base * (t_hash - ord(text[i]) * h) + ord(text[i + m])) % mod
            if t_hash < 0:
                t_hash += mod

    return result
```

## 計算量

### 期待計算量

ハッシュの衝突 (spurious hit) がないと仮定すれば:

- ハッシュ計算: $O(n)$ (Rolling Hash による)
- 文字列比較: 衝突回数 $\times O(m)$

良いハッシュ関数を使えば衝突回数の期待値は $O(n/p)$ ($p$ は法) なので、全体の期待計算量は $O(n + m)$。

### 最悪計算量

全位置でハッシュが衝突する場合、$O(nm)$ になりうる。これは素朴な方法と同じだが、実用上はほぼ起きない。

## 複数パターンへの拡張

Rabin-Karp法は複数パターンの同時検索に自然に拡張できる。

全パターンのハッシュ値をハッシュテーブルに格納し、テキストの各ウィンドウのハッシュ値をテーブルと照合する。

```python title="rabin_karp_multi.py"
def rabin_karp_multi(text: str, patterns: list[str]) -> dict[str, list[int]]:
    result = {p: [] for p in patterns}
    if not patterns:
        return result
    m = len(patterns[0])  # assume all same length
    pattern_hashes = {}
    for p in patterns:
        h = compute_hash(p)
        pattern_hashes.setdefault(h, []).append(p)

    # Slide window and check
    # ...
    return result
```

## KMP法との比較

| 項目 | KMP法 | Rabin-Karp法 |
|------|-------|-------------|
| 計算量 | 最悪 $O(n + m)$ | 期待 $O(n + m)$、最悪 $O(nm)$ |
| 確定的 | Yes | No (確率的) |
| 複数パターン | 非効率 | 自然に拡張可能 |
| 前処理 | 失敗関数 $O(m)$ | ハッシュ計算 $O(m)$ |
| 実装の簡潔さ | やや複雑 | 簡潔 |

## 応用

1. **盗用検出 (plagiarism detection)**: 文書間の類似部分を効率的に検出
2. **複数パターン検索**: 同じ長さの複数パターンを同時検索
3. **2次元パターンマッチング**: 行方向と列方向で独立に Rolling Hash を適用

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | テキスト (長さ $n$)、パターン (長さ $m$) |
| 出力 | パターンの出現位置 |
| 期待計算量 | $O(n + m)$ |
| 最悪計算量 | $O(nm)$ |
| 空間計算量 | $O(1)$ (追加) |
| 核心 | Rolling Hash によるハッシュ比較 + 一致時の検証 |
