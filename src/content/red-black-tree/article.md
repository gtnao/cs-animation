---
title: "赤黒木 解説"
---

## 赤黒木とは

**赤黒木 (Red-Black Tree)** は、各ノードに「赤」または「黒」の色を付け、5つの性質を維持することで平衡を保つ自己平衡二分探索木である。1972年にRudolf Bayerが発明し、1978年にGuibasとSedgewickが現在の形に整理した。

C++の `std::map` / `std::set`、Javaの `TreeMap` / `TreeSet`、Linuxカーネルのプロセススケジューラなど、実用上最も広く使われる平衡BSTの一つである。

### 5つの性質

赤黒木は以下の5つの性質を全て満たす二分探索木である。

1. **各ノードは赤か黒**: 全てのノードは赤または黒に色付けされている
2. **根は黒**: 根ノードは常に黒である
3. **葉 (NIL) は黒**: 全てのNILノード (外部ノード) は黒である
4. **赤の子は黒**: 赤ノードの子は必ず黒である (赤が連続しない)
5. **黒高さの一様性**: 任意のノードから子孫のNILノードまでの全てのパスには、同数の黒ノードが含まれる

### 黒高さ

ノード $v$ の**黒高さ** $\text{bh}(v)$ は、$v$ から任意の子孫NILノードまでのパスに含まれる黒ノードの数 ($v$ 自身を含まない) として定義される。性質5により、この値はパスの選び方によらず一定である。

## 高さの上界

**定理:** $n$ 個の内部ノードを持つ赤黒木の高さは高々 $2 \log_2(n + 1)$ である。

**証明:**

まず、ノード $v$ を根とする部分木が少なくとも $2^{\text{bh}(v)} - 1$ 個の内部ノードを持つことを帰納法で示す。

- **基底:** $v$ がNILなら $\text{bh}(v) = 0$、$2^0 - 1 = 0$ 個 (正しい)
- **帰納:** $v$ の子の黒高さは $\text{bh}(v)$ または $\text{bh}(v) - 1$ (子が赤か黒かによる)。帰納仮説より各部分木は $2^{\text{bh}(v)-1} - 1$ 個以上の内部ノードを持つ。従って $v$ を根とする部分木は少なくとも $2 \cdot (2^{\text{bh}(v)-1} - 1) + 1 = 2^{\text{bh}(v)} - 1$ 個の内部ノードを持つ。

性質4より、根から任意の葉へのパスで少なくとも半分は黒ノードなので、$\text{bh}(\text{root}) \geq h/2$ (ここで $h$ は木の高さ)。従って、

$$
n \geq 2^{h/2} - 1 \implies h \leq 2 \log_2(n + 1)
$$

$\square$

## 回転操作

赤黒木はAVL木と同様に左回転・右回転を使用する。

```python title="rotations.py"
def left_rotate(T, x):
    y = x.right
    x.right = y.left
    if y.left is not None:
        y.left.parent = x
    y.parent = x.parent
    if x.parent is None:
        T.root = y
    elif x == x.parent.left:
        x.parent.left = y
    else:
        x.parent.right = y
    y.left = x
    x.parent = y

def right_rotate(T, y):
    x = y.left
    y.left = x.right
    if x.right is not None:
        x.right.parent = y
    x.parent = y.parent
    if y.parent is None:
        T.root = x
    elif y == y.parent.left:
        y.parent.left = x
    else:
        y.parent.right = x
    x.right = y
    y.parent = x
```

## 挿入

### 手順

1. 通常のBSTの挿入を行い、新しいノードを**赤**に着色
2. 赤黒木の性質が破られた場合、修正を行う

### 修正 (Fix-up)

新ノードを $z$ とする。$z$ の親が赤の場合、性質4が破られる。修正は3つのケースに分かれる (親が祖父の左の子の場合。右の子の場合は対称)。

| ケース | 条件 | 操作 |
|--------|------|------|
| Case 1 | 叔父が赤 | 親と叔父を黒に、祖父を赤にして $z$ を祖父に移動 |
| Case 2 | 叔父が黒、$z$ が右の子 | $z$ の親で左回転し、Case 3に帰着 |
| Case 3 | 叔父が黒、$z$ が左の子 | 親を黒、祖父を赤にし、祖父で右回転 |

```python title="insert_fixup.py"
def insert_fixup(T, z):
    while z.parent and z.parent.color == RED:
        if z.parent == z.parent.parent.left:
            y = z.parent.parent.right  # uncle
            if y and y.color == RED:
                # Case 1
                z.parent.color = BLACK
                y.color = BLACK
                z.parent.parent.color = RED
                z = z.parent.parent
            else:
                if z == z.parent.right:
                    # Case 2
                    z = z.parent
                    left_rotate(T, z)
                # Case 3
                z.parent.color = BLACK
                z.parent.parent.color = RED
                right_rotate(T, z.parent.parent)
        else:
            # Symmetric cases
            y = z.parent.parent.left
            if y and y.color == RED:
                z.parent.color = BLACK
                y.color = BLACK
                z.parent.parent.color = RED
                z = z.parent.parent
            else:
                if z == z.parent.left:
                    z = z.parent
                    right_rotate(T, z)
                z.parent.color = BLACK
                z.parent.parent.color = RED
                left_rotate(T, z.parent.parent)
    T.root.color = BLACK
```

### 挿入の計算量

- BST挿入: $O(\log n)$
- Fix-up: Case 1は $z$ を上に移動するので高々 $O(\log n)$ 回、Case 2/3は高々2回の回転で終了
- 合計: $O(\log n)$

## 削除

削除はより複雑であるが、同様に $O(\log n)$ で実行できる。削除後に黒ノードが除去された場合、性質5が破られる可能性があり、4つのケースに分けて修正する。

削除の修正でも回転は高々3回で済む。

## AVL木との比較

| 特性 | AVL木 | 赤黒木 |
|------|-------|--------|
| 平衡条件 | 高さの差 $\leq 1$ | 黒高さの一様性 |
| 高さの上界 | $\approx 1.44 \log n$ | $\leq 2 \log n$ |
| 探索 | やや高速 (低い木) | やや遅い |
| 挿入 | 高々2回の回転 | 高々2回の回転 |
| 削除 | $O(\log n)$ 回の回転 | 高々3回の回転 |
| 用途 | 探索が多い場合 | 挿入・削除が多い場合 |

赤黒木は削除時の回転回数が定数で抑えられるため、挿入・削除が頻繁な場合に有利である。

## まとめ

| 項目 | 内容 |
|------|------|
| 着色 | 赤/黒の2色 |
| 核心の性質 | 黒高さの一様性 |
| 高さ | $\leq 2 \log_2(n+1)$ |
| 全操作 | $O(\log n)$ |
| 回転回数 | 挿入: 高々2回、削除: 高々3回 |
| 実用例 | C++ STL, Java Collections, Linux kernel |
