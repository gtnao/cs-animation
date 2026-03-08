---
title: "Palindromic Tree 解説"
---

## Palindromic Tree とは

Palindromic Tree (回文木、EERTREE) は、文字列の**全ての異なる回文部分文字列**を格納するデータ構造である。2014年に Mikhail Rubinchik によって提案された。

長さ $n$ の文字列に対して、異なる回文部分文字列は高々 $n + 1$ 個しかないという性質を利用している。

## 構造

### ノード

Palindromic Tree は2つの根を持つ。

- **偶数根 (ノード 0):** 長さ $-1$ の仮想ノード。偶数長の回文の起点
- **奇数根 (ノード 1):** 長さ $0$ の仮想ノード。奇数長の回文の起点

各ノードは一つの回文部分文字列に対応し、以下の情報を持つ。

- **len:** 対応する回文の長さ
- **suffLink:** 最長の真回文接尾辞に対応するノードへのリンク
- **children:** 文字 $c$ に対して、$c \cdot P \cdot c$ ($P$ は現在のノードの回文) に対応する子ノード

### Suffix Link

ノード $v$ の suffix link は、$v$ に対応する回文の**最長の真の回文接尾辞**に対応するノードを指す。

## 構築アルゴリズム

文字列を左から右に読みながら、1文字ずつオンラインで構築する。

```python title="palindromic_tree.py"
class PalindromicTree:
    def __init__(self):
        self.nodes = [
            {"len": -1, "suf": 0, "ch": {}},  # even root
            {"len": 0, "suf": 0, "ch": {}},   # odd root
        ]
        self.last = 1
        self.s = []

    def add(self, c: str) -> int:
        self.s.append(c)
        pos = len(self.s) - 1
        cur = self.last

        # Find longest palindromic suffix that can be extended
        while True:
            cur_len = self.nodes[cur]["len"]
            if pos - 1 - cur_len >= 0 and self.s[pos - 1 - cur_len] == c:
                break
            cur = self.nodes[cur]["suf"]

        if c in self.nodes[cur]["ch"]:
            self.last = self.nodes[cur]["ch"][c]
            return 0  # no new palindrome

        # Create new node
        new_id = len(self.nodes)
        self.nodes.append({
            "len": self.nodes[cur]["len"] + 2,
            "suf": -1,
            "ch": {},
        })
        self.nodes[cur]["ch"][c] = new_id

        # Set suffix link
        if self.nodes[new_id]["len"] == 1:
            self.nodes[new_id]["suf"] = 1
        else:
            tmp = self.nodes[cur]["suf"]
            while True:
                tmp_len = self.nodes[tmp]["len"]
                if pos - 1 - tmp_len >= 0 and self.s[pos - 1 - tmp_len] == c:
                    break
                tmp = self.nodes[tmp]["suf"]
            self.nodes[new_id]["suf"] = self.nodes[tmp]["ch"].get(c, 1)

        self.last = new_id
        return 1  # new palindrome added
```

## 計算量

### 命題: Palindromic Tree の構築は $O(n)$

**証明の概要:**

各文字の追加で suffix link を辿る回数の合計が $O(n)$ であることを示す。

ポテンシャル関数として、最後に追加した回文の長さ $\text{len}(\text{last})$ を使う。文字を追加すると `last` が変わり、suffix link を辿るたびにポテンシャルが減少する。ポテンシャルの増加は各ステップで高々 2 (新しい回文の長さの増加) なので、suffix link を辿る総回数は $O(n)$。

## 性質

1. **ノード数:** 高々 $n + 2$ (2つの根 + 高々 $n$ 個の回文)
2. **異なる回文部分文字列の数:** 高々 $n + 1$
3. **各ノードの suffix link を辿ると、全ての回文接尾辞を列挙できる**

## 応用

1. **異なる回文部分文字列の数:** ノード数 $- 2$ (根を除く)
2. **各回文の出現回数:** suffix link を逆向きに辿るDP
3. **回文分割:** Palindromic Tree 上のDP で回文への最小分割数を $O(n \log n)$ で求められる
4. **辞書順で $k$ 番目の回文:** ノードに子のサイズ情報を持たせて探索

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $n$ の文字列 |
| ノード数 | 高々 $n + 2$ |
| 構築時間 | $O(n)$ |
| 空間計算量 | $O(n)$ |
| 核心 | suffix link による最長回文接尾辞の再利用 |
