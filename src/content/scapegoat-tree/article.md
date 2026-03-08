---
title: "Scapegoat木 解説"
---

## Scapegoat木とは

**Scapegoat木** は、1989年にGalperinとRivestによって提案された平衡二分探索木である。回転操作を使わず、アンバランスが検出されたときに**部分木を完全に再構築** (flatten & rebuild) することで平衡を回復する。

### 基本アイデア

- 挿入時に木の深さが閾値を超えたら、挿入パス上で「スケープゴート (身代わり)」となるノードを見つける
- そのノードを根とする部分木を完全に再構築する
- 再構築は中間順走査でソートされた配列を作り、そこから完全平衡なBSTを構築する

### パラメータ $\alpha$

Scapegoat木はパラメータ $\alpha$ ($0.5 < \alpha < 1$) を持つ。ノード $v$ が **$\alpha$-weight-balanced** であるとは、以下が成り立つことである。

$$
\text{size}(v.\text{left}) \leq \alpha \cdot \text{size}(v)
$$

$$
\text{size}(v.\text{right}) \leq \alpha \cdot \text{size}(v)
$$

ここで $\text{size}(v)$ は $v$ を根とする部分木のノード数である。

## 高さの上界

**定理:** $\alpha$-weight-balanced な木の高さは $O(\log_{1/\alpha} n)$ 以下である。

**証明:** 根から葉までのパスで、各ノードの部分木サイズは少なくとも $1/\alpha$ 分の1に減少する。したがって高さは $\log_{1/\alpha} n$ 以下である。 $\square$

$\alpha = 2/3$ の場合、高さは $\log_{3/2} n \approx 1.71 \log_2 n$ である。

## 挿入

### 手順

1. 通常のBST挿入を行う
2. 新しいノードの深さが $\lfloor \log_{1/\alpha} n \rfloor$ を超えたら:
   a. 挿入パスを根に向かって遡り、$\alpha$-weight-balanced でない最も浅いノード (scapegoat) を見つける
   b. そのノードの部分木を再構築する

```python title="scapegoat_insert.py"
import math

ALPHA = 2 / 3

def insert(root, key):
    # BST insert, tracking depth and path
    node, depth, path = bst_insert_with_path(root, key)

    max_depth = math.floor(math.log(tree_size(root), 1 / ALPHA))

    if depth > max_depth:
        # Find scapegoat
        scapegoat = find_scapegoat(path)
        # Rebuild subtree
        rebuilt = rebuild(scapegoat)
        # Replace scapegoat in tree
        replace_subtree(root, scapegoat, rebuilt)

    return root
```

### 再構築

再構築は以下の2ステップで行う。

1. 部分木を中間順走査してソート済み配列に変換
2. ソート済み配列から完全平衡BSTを構築

```python title="rebuild.py"
def rebuild(node):
    # Step 1: flatten to sorted array
    nodes = []
    inorder(node, nodes)
    # Step 2: build balanced BST
    return build_balanced(nodes, 0, len(nodes) - 1)

def build_balanced(nodes, lo, hi):
    if lo > hi:
        return None
    mid = (lo + hi) // 2
    node = nodes[mid]
    node.left = build_balanced(nodes, lo, mid - 1)
    node.right = build_balanced(nodes, mid + 1, hi)
    return node
```

## 削除

削除も通常のBST削除を行い、木のサイズが「最大サイズ」の半分以下になったら木全体を再構築する。

$$
n \leq \alpha \cdot \text{maxSize} \implies \text{全体を再構築}
$$

## 計算量

| 操作 | 最悪 | ならし |
|------|------|--------|
| 探索 | $O(\log n)$ | $O(\log n)$ |
| 挿入 | $O(n)$ | $O(\log n)$ |
| 削除 | $O(n)$ | $O(\log n)$ |

### ならし解析

**定理:** $n$ 回の挿入のならし計算量は $O(n \log n)$、すなわち1回あたり $O(\log n)$ である。

**証明の概略:** 再構築のコストを「貯金」で支払う。ノードが挿入されるたびに $O(\log n)$ の貯金を行う。再構築が発生するノード $v$ の部分木はアンバランスであり、最後の再構築以降に $\Omega(\text{size}(v))$ 回の挿入が行われている。したがって蓄積された貯金で $O(\text{size}(v))$ の再構築コストを支払える。 $\square$

## 他の平衡BSTとの比較

| 特性 | Scapegoat木 | AVL木 | 赤黒木 |
|------|------------|-------|--------|
| 回転操作 | なし | あり | あり |
| 追加情報 | サイズ | 高さ | 色 |
| 挿入の最悪 | $O(n)$ | $O(\log n)$ | $O(\log n)$ |
| 利点 | 実装が単純、回転不要 | 厳密なバランス | 削除が効率的 |

## まとめ

| 項目 | 内容 |
|------|------|
| 提案者 | Galperin, Rivest (1993) |
| 平衡手法 | 部分木の再構築 |
| パラメータ | $\alpha \in (0.5, 1)$ |
| ならし計算量 | $O(\log n)$ |
| 核心 | 回転を使わず再構築で平衡を維持 |
| 利点 | 回転操作が不要で実装が容易 |
