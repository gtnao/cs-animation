---
title: "Rolling Hash 解説"
---

## Rolling Hash とは

Rolling Hash (ローリングハッシュ) は、文字列のスライディングウィンドウに対して、ハッシュ値を $O(1)$ で更新する技法である。

ウィンドウを1文字ずらすたびに、古い文字を除去し新しい文字を追加することで、全体を再計算することなくハッシュ値を更新できる。

## 多項式ハッシュ

### 定義

文字列 $S = s_0 s_1 \cdots s_{m-1}$ のハッシュ値を以下で定義する。

$$
H(S) = \left(\sum_{i=0}^{m-1} s_i \cdot b^i\right) \bmod p
$$

ここで $b$ は基数 (base)、$p$ は素数の法 (modulus) である。

### ウィンドウのスライド

位置 $k$ から始まる長さ $m$ の部分文字列 $S[k..k+m-1]$ のハッシュから、$S[k+1..k+m]$ のハッシュを求める。

$$
H(S[k+1..k+m]) = \frac{H(S[k..k+m-1]) - s_k}{b} + s_{k+m} \cdot b^{m-1} \pmod{p}
$$

$b$ の逆元を事前計算しておけば、この更新は $O(1)$ で行える。

## 実装

```python title="rolling_hash.py"
class RollingHash:
    def __init__(self, s: str, base: int = 31, mod: int = 10**9 + 7):
        self.s = s
        self.base = base
        self.mod = mod
        self.n = len(s)
        # Precompute prefix hashes and powers
        self.h = [0] * (self.n + 1)
        self.pw = [1] * (self.n + 1)
        for i in range(self.n):
            self.h[i + 1] = (self.h[i] + ord(s[i]) * self.pw[i]) % mod
            self.pw[i + 1] = self.pw[i] * base % mod

    def get_hash(self, l: int, r: int) -> int:
        """Get hash of s[l:r]"""
        # H(s[l:r]) = (h[r] - h[l]) * inv(pw[l])
        val = (self.h[r] - self.h[l]) % self.mod
        return val * pow(self.pw[l], self.mod - 2, self.mod) % self.mod
```

## 衝突の確率

### ハッシュ衝突

異なる2つの文字列が同じハッシュ値を持つことがある (衝突)。

長さ $m$ の文字列に対して、単一のハッシュ関数を使う場合の衝突確率は約 $1/p$ である。$p = 10^9 + 7$ なら約 $10^{-9}$。

### 衝突を減らすテクニック

1. **ダブルハッシュ:** 異なる $(b, p)$ のペアで2つのハッシュ値を計算する。衝突確率は約 $1/(p_1 \cdot p_2)$
2. **大きな法を使う:** $p$ を大きくする

## 応用

### 文字列比較

2つの部分文字列 $S[l_1..r_1]$ と $S[l_2..r_2]$ の一致を $O(1)$ で判定できる (ハッシュ値の比較)。

### パターンマッチング (Rabin-Karp)

テキスト中のパターン出現位置を Rolling Hash で検索する → Rabin-Karp法

### 最長共通部分文字列

二分探索と Rolling Hash を組み合わせて $O(n \log n)$ で求められる。

### 回文判定

文字列 $S$ と逆転 $S^R$ の Rolling Hash を構築し、部分文字列の回文判定を $O(1)$ で行える。

## 計算量

| 操作 | 計算量 |
|------|--------|
| 前処理 (接頭辞ハッシュ) | $O(n)$ |
| 区間ハッシュの取得 | $O(1)$ |
| ウィンドウのスライド | $O(1)$ |

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 文字列 $S$、ウィンドウサイズ $m$ |
| 出力 | 各ウィンドウのハッシュ値 |
| 前処理 | $O(n)$ |
| 更新 | $O(1)$ per window |
| 核心 | 多項式ハッシュのスライディング更新 |
| 注意 | 確率的手法。衝突の可能性あり |
