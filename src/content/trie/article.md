---
title: "Trie 解説"
---

## Trie とは

Trie (トライ、接頭辞木) は、文字列の集合を木構造で管理するデータ構造である。"Trie" という名前は "retrieval" に由来する。

根から各ノードへのパスが文字列の接頭辞に対応し、挿入・検索・削除を $O(|s|)$ ($|s|$ は操作する文字列の長さ) で行える。

### 構造

- 根ノードは空文字列に対応
- 各辺には1文字のラベルが付く
- あるノードの子は異なる文字で始まる
- 終端マーク付きのノードが集合に含まれる文字列の終点

## 基本操作

### 挿入

```python title="trie.py"
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for c in word:
            if c not in node.children:
                node.children[c] = TrieNode()
            node = node.children[c]
        node.is_end = True
```

### 検索

```python title="trie_search.py"
    def search(self, word: str) -> bool:
        node = self.root
        for c in word:
            if c not in node.children:
                return False
            node = node.children[c]
        return node.is_end

    def starts_with(self, prefix: str) -> bool:
        node = self.root
        for c in prefix:
            if c not in node.children:
                return False
            node = node.children[c]
        return True
```

## 計算量

| 操作 | 計算量 |
|------|--------|
| 挿入 | $O(\|s\|)$ |
| 検索 | $O(\|s\|)$ |
| 接頭辞検索 | $O(\|s\|)$ |
| 削除 | $O(\|s\|)$ |

空間計算量は最悪 $O(n \cdot |\Sigma|)$ ($n$ はノード数、$|\Sigma|$ はアルファベットサイズ)。配列ベースの実装の場合。ハッシュマップベースなら $O(n)$。

## 変種

### 圧縮Trie (Patricia Trie / Radix Tree)

1文字ずつではなく、共通部分のない経路を1つのエッジにまとめる。ノード数が文字列の数に比例し、空間効率がよい。

### 01-Trie (Binary Trie)

整数を2進表現した Trie。XOR に関する操作 (最大XOR 等) を効率的に処理できる。

## 応用

1. **辞書検索:** スペルチェッカー、オートコンプリート
2. **接頭辞マッチング:** IP ルーティングテーブル (最長一致接頭辞検索)
3. **文字列ソート:** Trie に挿入してDFS走査すると辞書順ソート
4. **Aho-Corasick法の基盤:** 複数パターン検索の Trie 部分
5. **XOR 最大化:** 01-Trie を使って集合の中から XOR が最大になるペアを検索

## ハッシュテーブルとの比較

| 項目 | Trie | ハッシュテーブル |
|------|------|----------------|
| 検索 | $O(\|s\|)$ | 期待 $O(\|s\|)$、最悪 $O(n \cdot \|s\|)$ |
| 接頭辞検索 | $O(\|p\|)$ | 不可能 or 非効率 |
| 辞書順列挙 | 容易 | 不可能 |
| 空間 | 大きい | 小さい |

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 文字列の集合 |
| 操作 | 挿入、検索、接頭辞検索 |
| 各操作の計算量 | $O(\|s\|)$ |
| 空間計算量 | $O(n \cdot |\Sigma|)$ |
| 核心 | 共通接頭辞を共有する木構造 |
