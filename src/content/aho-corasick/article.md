---
title: "Aho-Corasick法 解説"
---

## Aho-Corasick法とは

Aho-Corasick法は、テキスト $T$ の中から**複数のパターン** $P_1, P_2, \ldots, P_k$ を同時に検索するアルゴリズムである。1975年に Alfred Aho と Margaret Corasick によって発表された。

単一パターンの検索に KMP法を使うと各パターンに $O(n)$ かかり、$k$ 個のパターンで $O(nk)$ となる。Aho-Corasick法はこれを $O(n + m + z)$ に改善する。ここで $m$ はパターンの総文字数、$z$ は出力の総数である。

## 構成要素

Aho-Corasick法は以下の 3 つの要素で構成される。

### 1. Trie (goto 関数)

全パターンを Trie に挿入する。Trie の各ノードは文字列の接頭辞に対応する。

```python title="build_trie.py"
def build_trie(patterns: list[str]) -> dict:
    trie = [{"children": {}, "output": [], "fail": 0}]
    for i, pattern in enumerate(patterns):
        node = 0
        for c in pattern:
            if c not in trie[node]["children"]:
                trie[node]["children"][c] = len(trie)
                trie.append({"children": {}, "output": [], "fail": 0})
            node = trie[node]["children"][c]
        trie[node]["output"].append(i)
    return trie
```

### 2. 失敗リンク (failure link)

KMP法の失敗関数を Trie 全体に拡張したものが失敗リンクである。

ノード $v$ の失敗リンク $\text{fail}(v)$ は、$v$ に対応する文字列の**最長の真の接尾辞**であって Trie 中のノードに対応するものを指す。

失敗リンクは BFS で構築する。

```python title="build_failure_links.py"
from collections import deque

def build_failure_links(trie):
    queue = deque()
    for c, v in trie[0]["children"].items():
        trie[v]["fail"] = 0
        queue.append(v)
    while queue:
        u = queue.popleft()
        for c, v in trie[u]["children"].items():
            f = trie[u]["fail"]
            while f != 0 and c not in trie[f]["children"]:
                f = trie[f]["fail"]
            trie[v]["fail"] = trie[f]["children"].get(c, 0)
            if trie[v]["fail"] == v:
                trie[v]["fail"] = 0
            # Merge output
            trie[v]["output"] += trie[trie[v]["fail"]]["output"]
            queue.append(v)
```

### 3. 出力関数 (output function)

各ノードに到達したとき、そのノードで終了するパターン (および失敗リンクの連鎖で到達するパターン) を列挙する。

## 検索アルゴリズム

テキストを 1 文字ずつ読みながら Trie 上を遷移する。遷移できない場合は失敗リンクをたどる。

```python title="aho_corasick_search.py"
def search(text: str, trie, patterns: list[str]) -> list[tuple[int, str]]:
    results = []
    node = 0
    for i, c in enumerate(text):
        while node != 0 and c not in trie[node]["children"]:
            node = trie[node]["fail"]
        if c in trie[node]["children"]:
            node = trie[node]["children"][c]
        for pi in trie[node]["output"]:
            results.append((i - len(patterns[pi]) + 1, patterns[pi]))
    return results
```

## 動作例

テキスト `ushers`、パターン `{he, she, his, hers}` で検索する。

1. `u` → ルートに留まる
2. `s` → ノードへ遷移
3. `h` → `sh` のノードへ
4. `e` → `she` のノードへ → パターン `she` 発見、失敗リンクにより `he` も発見
5. `r` → `her` のノードへ
6. `s` → `hers` のノードへ → パターン `hers` 発見

## 計算量

### 構築

- Trie の構築: $O(m)$ (全パターンの総文字数)
- 失敗リンクの構築: $O(m \cdot |\Sigma|)$ (最悪の場合、$|\Sigma|$ はアルファベットサイズ)

### 検索

- テキストの走査: $O(n)$
- 出力: $O(z)$ ($z$ はマッチの総数)

全体: $O(n + m + z)$

### 計算量の証明の概要

テキスト走査中、goto 遷移が成功するたびに Trie の深さが 1 増加する。失敗リンクをたどるとき深さは必ず減少する。深さの増加量の合計は $O(n)$ (テキストの長さ) なので、失敗リンクをたどる回数の合計も $O(n)$ である。

## KMP法との関係

Aho-Corasick法は KMP法を複数パターンに拡張したものと見なせる。

- KMP法のパターンが 1 本の文字列 → Aho-Corasick法では複数のパターンが Trie を形成
- KMP法の失敗関数 → Aho-Corasick法の失敗リンク
- KMP法のテキスト走査 → Aho-Corasick法のテキスト走査 (同一の構造)

## 応用

1. **侵入検知システム (IDS)**: ネットワークパケット内の既知の攻撃パターンを高速に検出
2. **テキストエディタ**: 複数キーワードの同時ハイライト
3. **DNA配列解析**: 複数の短い配列モチーフの同時検索
4. **コンパイラ**: 予約語の認識

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | テキスト (長さ $n$)、パターン集合 (総文字数 $m$) |
| 出力 | 全パターンの出現位置 |
| 構築 | $O(m)$ |
| 検索 | $O(n + z)$ |
| 空間計算量 | $O(m)$ |
| 核心 | Trie + 失敗リンクで複数パターンの同時検索 |
