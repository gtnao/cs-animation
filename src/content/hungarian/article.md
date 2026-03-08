---
title: "ハンガリアン法 解説"
---

## ハンガリアン法とは

ハンガリアン法 (Hungarian algorithm) は、**二部グラフの最小重み完全マッチング** (割当問題) を $O(n^3)$ で解くアルゴリズムである。1955年に Harold Kuhn がハンガリーの数学者 Denes Konig と Jeno Egervary の研究に基づいて発表したため、この名前がついた。

## 割当問題

### 定義

$n$ 人のワーカーと $n$ 個のタスクがあり、ワーカー $i$ がタスク $j$ を行うコストが $c_{ij}$ で与えられる。各ワーカーにちょうど1つのタスクを、各タスクにちょうど1人のワーカーを割り当て、総コストを最小化する。

$$
\min_{\sigma \in S_n} \sum_{i=1}^{n} c_{i,\sigma(i)}
$$

ここで $\sigma$ は $\{1, \ldots, n\}$ の置換である。

### 行列表現

コスト行列 $C = (c_{ij})$ で表し、各行からちょうど1つ、各列からちょうど1つの要素を選んで総和を最小化する。

## アルゴリズムの手順

### Step 1: 行簡約

各行の最小値をその行の全要素から引く。

$$
c'_{ij} = c_{ij} - \min_k c_{ik}
$$

### Step 2: 列簡約

各列の最小値をその列の全要素から引く。

$$
c''_{ij} = c'_{ij} - \min_k c'_{kj}
$$

### Step 3: ゼロによる割当

簡約された行列のゼロ要素を使って、最大マッチングを求める。完全マッチングが見つかれば終了。

### Step 4: 最小被覆線

全てのゼロを覆う最小本数の直線 (行または列) を引く。Konig の定理より、最小被覆線の数 = 最大マッチングの数。

### Step 5: 行列の調整

1. 被覆されていない要素の最小値 $\delta$ を求める
2. 被覆されていない要素から $\delta$ を引く
3. 二重に被覆された要素に $\delta$ を足す

Step 3 に戻る。

```python title="hungarian.py"
def hungarian(cost_matrix):
    n = len(cost_matrix)
    C = [row[:] for row in cost_matrix]

    # Step 1: Row reduction
    for i in range(n):
        min_val = min(C[i])
        for j in range(n):
            C[i][j] -= min_val

    # Step 2: Column reduction
    for j in range(n):
        min_val = min(C[i][j] for i in range(n))
        for i in range(n):
            C[i][j] -= min_val

    while True:
        # Step 3: Find maximum matching on zeros
        matching = find_max_matching(C)
        if len(matching) == n:
            return matching

        # Step 4: Find minimum cover
        row_covered, col_covered = min_cover(C, matching)

        # Step 5: Adjust matrix
        delta = min(C[i][j]
                    for i in range(n) for j in range(n)
                    if not row_covered[i] and not col_covered[j])

        for i in range(n):
            for j in range(n):
                if not row_covered[i] and not col_covered[j]:
                    C[i][j] -= delta
                elif row_covered[i] and col_covered[j]:
                    C[i][j] += delta
```

## 正当性の証明

### 行・列の定数加減は最適解を変えない

行列の行全体に定数を加えても、列全体に定数を加えても、最適な割当の組み合わせは変わらない。なぜなら任意の完全マッチングのコストが同じ定数だけ変化するからである。

### 最適性条件

簡約後の行列の全要素が非負であるため、**ゼロ要素だけで完全マッチングが構成できれば、そのコストは 0 であり最小**である。元の行列での対応するコストが最適解。

### 収束性

**定理**: Step 5 の調整を行うたびに、ゼロの配置が変化し、最小被覆線の数が増加する。したがってアルゴリズムは高々 $n$ 回の反復で収束する。

**証明**: $\delta > 0$ (被覆されていない要素の中に正の値が存在) なので、調整後に新しいゼロが少なくとも1つ生まれる。被覆線の数は減少しない。最小被覆線の数が $n$ に達すれば完全マッチングが存在する。 $\square$

## 計算量

### 素朴な実装: $O(n^4)$

- 各反復: $O(n^2)$ (行列走査 + 調整)
- 反復回数: $O(n)$
- マッチング発見: 各反復 $O(n^2)$

### 改良された実装: $O(n^3)$

ポテンシャルを用いた実装では:

- 各ワーカーの処理: $O(n^2)$
- ワーカー数: $n$
- **全体: $O(n^3)$**

## 双対問題との関係

割当問題の線形計画緩和:

$$
\min \sum_{i,j} c_{ij} x_{ij}
$$

制約: $\sum_j x_{ij} = 1$, $\sum_i x_{ij} = 1$, $x_{ij} \geq 0$

その双対問題:

$$
\max \sum_i u_i + \sum_j v_j
$$

制約: $u_i + v_j \leq c_{ij}$

ハンガリアン法は双対変数 $u_i, v_j$ を操作しながら相補性条件 ($x_{ij} > 0 \Rightarrow u_i + v_j = c_{ij}$) を満たす解を構成する主双対法と見なせる。

## 応用

- **ジョブスケジューリング**: ワーカーのタスク割当
- **パターン認識**: 特徴点のマッチング
- **追跡問題**: フレーム間のオブジェクト対応付け
- **最適輸送**: Wasserstein距離の計算

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n \times n$ コスト行列 |
| 出力 | 最小コスト完全マッチング |
| 時間計算量 | $O(n^3)$ |
| 空間計算量 | $O(n^2)$ |
| 核心 | 行列簡約と被覆線による反復改善 |
| 正当性 | 双対理論と相補性条件 |
