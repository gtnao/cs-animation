---
title: "Suffix Automaton 解説"
---

## Suffix Automaton とは

Suffix Automaton (接尾辞オートマトン, SAM) は、文字列 $S$ の全ての部分文字列をちょうど認識する**最小の決定性有限オートマトン (DFA)** である。

### 性質

長さ $n$ の文字列に対して:

- 状態数は高々 $2n - 1$ (初期状態を含む)
- 遷移数は高々 $3n - 4$
- オンライン構築が可能 ($O(n)$ 時間)

## endpos の概念

### 定義

部分文字列 $t$ の **endpos** 集合を、$t$ が $S$ 中に出現する全ての終了位置の集合として定義する。

$$
\text{endpos}(t) = \{\ i \mid S[i - |t| + 1..i] = t\ \}
$$

### endpos 等価クラス

$\text{endpos}(t_1) = \text{endpos}(t_2)$ であるとき、$t_1$ と $t_2$ は同じ等価クラスに属する。

SAM の各状態は一つの endpos 等価クラスに対応する。

### 重要な性質

1. 同じ等価クラスの部分文字列は、最長のものの連続する接尾辞である
2. $\text{endpos}(t_1)$ と $\text{endpos}(t_2)$ は包含関係か素のいずれかである (交差しない)
3. endpos 等価クラスの包含関係は木構造をなす (suffix link tree)

## 構築アルゴリズム

### Suffix Link

各状態 $v$ の suffix link は、$v$ の最長文字列の最長真接尾辞であって異なる endpos を持つものに対応する状態を指す。

### オンライン構築

文字を1つずつ追加して SAM を構築する。

```python title="suffix_automaton.py"
class State:
    def __init__(self):
        self.len = 0
        self.link = -1
        self.transitions = {}

def build_sam(s: str) -> list[State]:
    sa = [State()]  # initial state
    last = 0

    for c in s:
        cur = len(sa)
        sa.append(State())
        sa[cur].len = sa[last].len + 1

        p = last
        while p != -1 and c not in sa[p].transitions:
            sa[p].transitions[c] = cur
            p = sa[p].link

        if p == -1:
            sa[cur].link = 0
        else:
            q = sa[p].transitions[c]
            if sa[p].len + 1 == sa[q].len:
                sa[cur].link = q
            else:
                clone = len(sa)
                sa.append(State())
                sa[clone].len = sa[p].len + 1
                sa[clone].link = sa[q].link
                sa[clone].transitions = dict(sa[q].transitions)
                while p != -1 and sa[p].transitions.get(c) == q:
                    sa[p].transitions[c] = clone
                    p = sa[p].link
                sa[q].link = clone
                sa[cur].link = clone

        last = cur

    return sa
```

## 計算量

### 命題: SAM の構築は $O(n)$

**証明の概要:**

各文字の追加で行われる操作を分析する。

- 新しい状態の作成: $O(1)$
- suffix link を辿る while ループ: ポテンシャル論法で合計 $O(n)$
- クローン操作: 遷移のコピーはアルファベットサイズに依存するが、整数アルファベットでは $O(1)$ amortized

## 応用

### 部分文字列の判定

文字列 $t$ が $S$ の部分文字列かどうかを $O(|t|)$ で判定できる。初期状態から $t$ の各文字で遷移できるかチェックする。

### 異なる部分文字列の数

SAM の各状態 $v$ は $\text{len}(v) - \text{len}(\text{link}(v))$ 個の異なる部分文字列に対応する。全状態の和が答え。

$$
\sum_{v} (\text{len}(v) - \text{len}(\text{link}(v)))
$$

### 最長共通部分文字列

$S_1$ の SAM を構築し、$S_2$ を走査して最長一致を求める。$O(|S_1| + |S_2|)$。

### 出現回数の計数

各状態の endpos 集合のサイズが対応する部分文字列の出現回数。suffix link tree 上のDP で $O(n)$ で計算可能。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $n$ の文字列 $S$ |
| 出力 | 全部分文字列を認識する最小 DFA |
| 状態数 | 高々 $2n - 1$ |
| 遷移数 | 高々 $3n - 4$ |
| 構築時間 | $O(n)$ |
| 核心 | endpos 等価クラスと suffix link |
