---
title: "線形基底 Linear Basis / XOR Basis 解説"
---

## 線形基底とは

線形基底 (Linear Basis, XOR Basis) は、$\mathbb{F}_2$ (GF(2)) 上のベクトル空間における基底を効率的に管理するデータ構造である。整数の集合 $S$ から、XOR 演算で生成できる全ての値の集合 (線形包) を、最小限の基底ベクトルで表現する。

### 問題設定

非負整数の集合 $S = \{a_1, a_2, \ldots, a_n\}$ が与えられたとき、

$$
\text{span}(S) = \left\{ \bigoplus_{i \in T} a_i \mid T \subseteq \{1, \ldots, n\} \right\}
$$

すなわち $S$ の部分集合の XOR で表現できる全ての値の集合を管理したい。基底 $B$ は $\text{span}(B) = \text{span}(S)$ かつ $|B|$ が最小のものである。

### 基底の性質

$B$ の要素数は $S$ の元を $\mathbb{F}_2$ 上のベクトルとみなしたときの階数 (rank) に等しい。最大でもビット幅 $w$ 個であり、$|B| \leq w$ が成り立つ。

## アルゴリズム

### 基底への挿入

各値を上位ビットから処理し、基底配列のスロットに挿入する。

```python title="linear_basis.py"
class LinearBasis:
    def __init__(self, max_bit: int = 60):
        self.max_bit = max_bit
        self.basis = [0] * max_bit

    def insert(self, val: int) -> bool:
        """Insert val into basis. Returns True if val was independent."""
        cur = val
        for bit in range(self.max_bit - 1, -1, -1):
            if not (cur >> bit & 1):
                continue
            if self.basis[bit] == 0:
                self.basis[bit] = cur
                return True
            cur ^= self.basis[bit]
        return False  # val is linearly dependent
```

### 動作の直感

値 $v$ を挿入するとき、最上位ビットから順に見ていく。

1. ビット $b$ が立っている場合、$\text{basis}[b]$ を確認
2. $\text{basis}[b] = 0$ なら、$v$ を $\text{basis}[b]$ に格納 (新しい基底ベクトル)
3. $\text{basis}[b] \neq 0$ なら、$v \leftarrow v \oplus \text{basis}[b]$ として上位ビットを消す
4. $v = 0$ になったら、元の値は既存の基底で表現可能 (線形従属)

### 計算量

- **挿入:** $O(w)$ ($w$ はビット幅)
- **全体:** $O(nw)$

## 正当性の証明

### 命題: アルゴリズムは正しい基底を構築する

**証明:**

不変条件: 各ステップ後、$\text{span}(\text{basis}) = \text{span}(\text{処理済みの値})$ が成り立つ。

- **初期状態:** $\text{basis}$ は全て 0 であり、$\text{span}(\emptyset) = \{0\}$。成立
- **挿入が成功した場合:** 新しい値 $v$ (の XOR 変換後) が基底に追加される。変換 $v' = v \oplus b_1 \oplus b_2 \oplus \cdots$ は既存の基底元との XOR なので、$\text{span}(\text{basis} \cup \{v'\}) = \text{span}(\text{basis} \cup \{v\})$。不変条件は保たれる
- **挿入が失敗した場合:** $v$ が 0 に還元された。つまり $v$ は既存の基底元の XOR で表現可能であり、$v \in \text{span}(\text{basis})$。不変条件は保たれる

**基底の最小性:** 各 $\text{basis}[b]$ はビット $b$ が最上位ビットであるようなベクトルであり、異なるスロットのベクトルは最上位ビットが異なる。したがって基底のベクトル同士は線形独立であり、基底は最小である。 $\square$

## 応用

### 最大 XOR 値

集合 $S$ の部分集合の XOR で得られる最大値を求める。

```python title="max_xor.py"
def max_xor(basis: list[int], max_bit: int) -> int:
    result = 0
    for bit in range(max_bit - 1, -1, -1):
        if basis[bit] != 0:
            result = max(result, result ^ basis[bit])
    return result
```

上位ビットから貪欲に取る。$\text{result} \oplus \text{basis}[b] > \text{result}$ であれば XOR する。

**正当性:** 上位ビットから貪欲に決めることが最適である。ビット $b$ を立てることで $2^b$ の増加が得られ、ビット $b$ 未満の全ビットを立てても $2^b - 1 < 2^b$ なので、上位ビットの決定を覆すことはできない。

### 最小 XOR 値

集合 $S$ の非空部分集合の XOR で得られる最小の正の値を求める。基底を簡約化 (行簡約階段形に変換) した後、基底の最小の非零値が答えである。

### k 番目に小さい XOR 値

基底を簡約化した後、$k$ を二進表現し、各ビットに対応する基底元を XOR する。

```python title="kth_xor.py"
def kth_xor(basis: list[int], max_bit: int, k: int) -> int:
    # First, reduce basis to RREF
    reduced = reduce_basis(basis, max_bit)
    non_zero = [b for b in reduced if b != 0]
    if k >= (1 << len(non_zero)):
        return -1  # Only 2^rank distinct values
    result = 0
    for i, b in enumerate(non_zero):
        if (k >> i) & 1:
            result ^= b
    return result
```

### XOR 値の個数

基底のサイズ (rank) が $r$ のとき、$\text{span}(S)$ の要素数は $2^r$ 個 (0 を含む) である。

### 値の表現可能性判定

値 $v$ が $\text{span}(S)$ に含まれるか判定する。基底に対して挿入操作を試み、$v$ が 0 に還元されれば表現可能。

```python title="can_represent.py"
def can_represent(basis: list[int], max_bit: int, val: int) -> bool:
    cur = val
    for bit in range(max_bit - 1, -1, -1):
        if (cur >> bit) & 1:
            if basis[bit] == 0:
                return False
            cur ^= basis[bit]
    return cur == 0
```

## 基底の簡約化

挿入後の基底は一般に行階段形であるが、簡約行階段形 (RREF) ではない。RREF にすることで、各基底ベクトルの最上位ビットの位置が他のベクトルでは 0 になる。

```python title="reduce_basis.py"
def reduce_basis(basis: list[int], max_bit: int) -> list[int]:
    reduced = basis[:]
    for bit in range(max_bit):
        if reduced[bit] == 0:
            continue
        for other in range(max_bit):
            if other == bit:
                continue
            if (reduced[other] >> bit) & 1:
                reduced[other] ^= reduced[bit]
    return reduced
```

## 基底のマージ

2つの基底をマージして、両方の集合の XOR で表現できる値の基底を得る。一方の基底の各要素をもう一方に挿入すればよい。

```python title="merge_basis.py"
def merge(basis1: list[int], basis2: list[int], max_bit: int) -> list[int]:
    result = basis1[:]
    for bit in range(max_bit):
        if basis2[bit] != 0:
            cur = basis2[bit]
            for b in range(max_bit - 1, -1, -1):
                if not (cur >> b & 1):
                    continue
                if result[b] == 0:
                    result[b] = cur
                    break
                cur ^= result[b]
    return result
```

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 非負整数の集合 $S$ |
| 出力 | XOR 基底 (最大 $w$ 個のベクトル) |
| 挿入 | $O(w)$ |
| 最大 XOR クエリ | $O(w)$ |
| 空間計算量 | $O(w)$ |
| 核心 | 上位ビットから貪欲に基底スロットを埋める |
| 応用 | 最大/最小 XOR、k番目、表現可能性判定 |
