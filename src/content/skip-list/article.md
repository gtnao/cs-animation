---
title: "Skip List 解説"
---

## Skip List とは

**Skip List** は、1990年にWilliam Pugによって提案されたランダム化データ構造であり、ソートされた連結リストに複数段のインデックスを追加して $O(\log n)$ の探索を実現する。

平衡二分探索木の代替として設計されており、実装の単純さとロックフリーの並行実装が容易な点が特徴である。

### 構造

Skip List は複数レベルのリンクリストで構成される。

- **レベル 0** (最下段): 全要素がソート順に並んだ通常のリンクリスト
- **レベル 1**: レベル 0 の一部の要素へのリンク
- **レベル 2**: レベル 1 の一部の要素へのリンク
- ...

各要素のレベルはランダムに決定される。確率 $p$ (通常 $p = 1/2$) でレベルが1つ上がる。

### 直感的な理解

Skip List は「高速道路」のアナロジーで理解できる。

- レベル 0 = 一般道路 (全ての場所を通る)
- レベル 1 = 県道 (主要な場所のみ)
- レベル 2 = 高速道路 (大きな都市のみ)

探索時は最上段の「高速道路」から始め、行き過ぎたら一段下に降りる。

## 探索

```python title="skiplist_search.py"
def search(skip_list, key):
    node = skip_list.header
    for level in range(skip_list.max_level, -1, -1):
        while node.forward[level] and node.forward[level].key < key:
            node = node.forward[level]
    node = node.forward[0]
    if node and node.key == key:
        return node
    return None
```

探索は最上レベルから開始し、各レベルで可能な限り右に進み、行き過ぎたら1レベル下に降りる。

## 挿入

### レベルの決定

新しい要素のレベルはランダムに決定する。コイン投げの要領で、表が出る限りレベルを上げる。

```python title="random_level.py"
import random

def random_level(max_level, p=0.5):
    level = 0
    while random.random() < p and level < max_level:
        level += 1
    return level
```

### 挿入手順

1. 探索と同様にパスを辿り、各レベルの「直前ノード」を記録
2. ランダムにレベルを決定
3. 新しいノードを作成し、各レベルのリンクを更新

```python title="skiplist_insert.py"
def insert(skip_list, key):
    update = [None] * (skip_list.max_level + 1)
    node = skip_list.header

    for level in range(skip_list.max_level, -1, -1):
        while node.forward[level] and node.forward[level].key < key:
            node = node.forward[level]
        update[level] = node

    level = random_level(skip_list.max_level)
    new_node = SkipNode(key, level)

    for i in range(level + 1):
        new_node.forward[i] = update[i].forward[i]
        update[i].forward[i] = new_node
```

## 削除

削除は挿入の逆操作。各レベルで対象ノードをスキップするようにリンクを更新する。

```python title="skiplist_delete.py"
def delete(skip_list, key):
    update = [None] * (skip_list.max_level + 1)
    node = skip_list.header

    for level in range(skip_list.max_level, -1, -1):
        while node.forward[level] and node.forward[level].key < key:
            node = node.forward[level]
        update[level] = node

    target = node.forward[0]
    if target and target.key == key:
        for i in range(len(target.forward)):
            if update[i].forward[i] != target:
                break
            update[i].forward[i] = target.forward[i]
```

## 計算量

### 期待計算量

**定理:** $n$ 要素の Skip List ($p = 1/2$) の期待探索時間は $O(\log n)$ である。

**証明の概略:**

探索パスを逆方向に辿ることを考える。各ステップで「上に行く」(確率 $p$) か「左に行く」(確率 $1-p$) かのどちらかである。

レベル 0 からレベル $\log_{1/p} n$ まで上がるのに必要なステップ数の期待値は $O(\log n / \log(1/p))$ である。$p = 1/2$ の場合、これは $O(\log n)$ となる。

### 空間計算量

各要素のレベルの期待値は $1/(1-p)$ なので、全体の期待ポインタ数は $n/(1-p)$ = $O(n)$。

| 操作 | 期待計算量 |
|------|-----------|
| 探索 | $O(\log n)$ |
| 挿入 | $O(\log n)$ |
| 削除 | $O(\log n)$ |
| 空間 | $O(n)$ |

### 最悪計算量

理論上の最悪計算量は $O(n)$ (全ての要素がレベル 0) だが、これが起こる確率は指数的に小さい。高確率 (high probability) で $O(\log n)$ が保証される。

## 並行Skip List

Skip List の大きな実用的利点は、**ロックフリーの並行実装** が比較的容易なことである。

木構造では回転操作が複数のポインタを同時に変更する必要があり、並行制御が複雑になる。Skip List では各レベルのリンクを独立にCAS (Compare-And-Swap) で更新できる。

Java の `ConcurrentSkipListMap` や Redis の Sorted Set が Skip List を採用している理由の一つである。

## 実用例

- **Redis**: Sorted Set の内部実装
- **Java**: `ConcurrentSkipListMap`, `ConcurrentSkipListSet`
- **LevelDB / RocksDB**: MemTable の実装
- **Lucene**: ポスティングリストの一部

## まとめ

| 項目 | 内容 |
|------|------|
| 提案者 | William Pug (1990) |
| 構造 | 多段リンクリスト |
| レベル決定 | ランダム (確率 $p$) |
| 期待計算量 | $O(\log n)$ |
| 空間 | $O(n)$ |
| 利点 | 実装が単純、並行処理に適する |
| 欠点 | キャッシュ効率は木より劣る場合がある |
