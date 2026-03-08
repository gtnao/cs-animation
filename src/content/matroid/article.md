---
title: "Matroid (マトロイド) 解説"
---

## マトロイドとは

マトロイド (Matroid) は、貪欲法の正当性を保証する組合せ構造を抽象化した概念である。1935年に Whitney が導入し、線形代数における線形独立性とグラフ理論における森の概念を統一的に扱うための枠組みとして誕生した。

直感的には、「独立」という概念が自然に定まり、かつその独立性に対して貪欲法がうまく機能するような構造がマトロイドである。

## 独立性公理による定義

### 定義

台集合 $E$ とその部分集合族 $\mathcal{I} \subseteq 2^E$ の組 $M = (E, \mathcal{I})$ がマトロイドであるとは、以下の3条件 (独立性公理) を満たすことをいう:

1. **(I1) 空集合条件**: $\emptyset \in \mathcal{I}$
2. **(I2) 遺伝性 (hereditary property)**: $A \in \mathcal{I}$ かつ $B \subseteq A$ ならば $B \in \mathcal{I}$
3. **(I3) 増大性 (augmentation property / 交換公理)**: $A, B \in \mathcal{I}$ かつ $|A| < |B|$ ならば、ある $x \in B \setminus A$ が存在して $A \cup \{x\} \in \mathcal{I}$

$\mathcal{I}$ の元を**独立集合** (independent set)、独立でない集合を**従属集合** (dependent set) という。

### 基と回路

- **基 (base)**: 極大独立集合。マトロイドの全ての基は同じサイズを持つ (これは増大性 (I3) から直ちに従う)。
- **回路 (circuit)**: 極小従属集合。すなわち、それ自体は従属だが、任意の真部分集合は独立であるような集合。
- **ランク (rank)**: 最大の独立集合のサイズ。部分集合 $A \subseteq E$ に対するランク関数 $r(A)$ は、$A$ に含まれる最大の独立集合のサイズとして定義される。

### 基の等サイズ性の証明

**命題**: マトロイドの全ての基は同じサイズを持つ。

**証明**: 基 $B_1, B_2$ について $|B_1| < |B_2|$ と仮定すると、(I3) より $x \in B_2 \setminus B_1$ が存在して $B_1 \cup \{x\} \in \mathcal{I}$ となる。これは $B_1$ の極大性に矛盾する。同様に $|B_1| > |B_2|$ も矛盾する。よって $|B_1| = |B_2|$。 $\square$

## 同値な公理系

マトロイドは独立性公理以外にも、いくつかの同値な公理系で定義できる。

### ランク公理

関数 $r: 2^E \to \mathbb{Z}_{\geq 0}$ がマトロイドのランク関数であるための必要十分条件は:

1. **(R1)**: $0 \leq r(A) \leq |A|$ (全ての $A \subseteq E$ に対して)
2. **(R2)**: $A \subseteq B$ ならば $r(A) \leq r(B)$ (単調性)
3. **(R3)**: $r(A \cup B) + r(A \cap B) \leq r(A) + r(B)$ (劣モジュラ性)

ランク関数から独立集合族を復元するには、$\mathcal{I} = \{ A \subseteq E \mid r(A) = |A| \}$ とすればよい。

### 閉包公理

閉包演算 $\text{cl}: 2^E \to 2^E$ を $\text{cl}(A) = \{ x \in E \mid r(A \cup \{x\}) = r(A) \}$ で定義する。直感的には、$A$ にどの要素を加えてもランクが増えない要素の全体である。この閉包演算は以下を満たす:

1. $A \subseteq \text{cl}(A)$
2. $A \subseteq B$ ならば $\text{cl}(A) \subseteq \text{cl}(B)$
3. $\text{cl}(\text{cl}(A)) = \text{cl}(A)$
4. $y \in \text{cl}(A \cup \{x\}) \setminus \text{cl}(A)$ ならば $x \in \text{cl}(A \cup \{y\})$ (Steinitz 交換性)

## 代表的なマトロイド

### 一様マトロイド $U_{r,n}$

$|E| = n$ の台集合上で、サイズ $r$ 以下の全ての部分集合が独立。

$$
\mathcal{I} = \{ A \subseteq E \mid |A| \leq r \}
$$

最も単純なマトロイドであり、公理の検証が容易である。$r = n$ のとき**自由マトロイド** (全部分集合が独立)、$r = 0$ のとき空集合のみが独立なマトロイドとなる。

### グラフィックマトロイド (グラフマトロイド)

グラフ $G = (V, E)$ に対し、台集合を辺集合 $E$ とし、独立集合を**森** (閉路を含まない辺の集合) とする。

$$
\mathcal{I} = \{ F \subseteq E \mid F \text{ は森} \}
$$

これがマトロイドの公理を満たすことを確認する:

- **(I1)**: 空集合は森である。
- **(I2)**: 森の部分集合は森である (辺を除いても閉路は生じない)。
- **(I3)**: 2つの森 $F_1, F_2$ で $|F_1| < |F_2|$ のとき、$F_2$ には $F_1$ よりも多くの頂点を連結にする辺がある。そのような辺 $e \in F_2 \setminus F_1$ を取ると、$F_1 \cup \{e\}$ は森となる。

基は全域木 (あるいは各連結成分の全域木) に対応する。ランクは $|V| - c$ ($c$ は連結成分数) である。

### 線形マトロイド

体 $\mathbb{F}$ 上の $m \times n$ 行列 $A$ の列ベクトルの集合を台集合とし、**線形独立な列の集合**を独立集合とする。

$$
\mathcal{I} = \{ S \subseteq \{1, \ldots, n\} \mid A \text{ の列 } S \text{ が線形独立} \}
$$

ランクは行列のランクに等しい。線形マトロイドは表現可能マトロイドとも呼ばれ、マトロイドの中でも最もよく研究されているクラスの一つである。

### 分割マトロイド (パーティションマトロイド)

台集合 $E$ を互いに素な部分集合 $E_1, E_2, \ldots, E_k$ に分割し、各 $E_i$ から高々 $d_i$ 個選べるとする。

$$
\mathcal{I} = \{ A \subseteq E \mid \forall i:\ |A \cap E_i| \leq d_i \}
$$

これは二部グラフのマッチング問題や割当問題で自然に現れる。例えば、ジョブスケジューリングで各カテゴリから一定数のジョブを選ぶ制約は分割マトロイドで表現できる。

### 横断マトロイド

二部グラフ $G = (S, T; E)$ に対して、台集合を $S$ とし、$T$ のどこかにマッチングされうる $S$ の部分集合を独立集合とする。分割マトロイドは横断マトロイドの特殊ケースである。

## 貪欲法の最適性

### 定理 (Rado-Edmonds)

重み関数 $w: E \to \mathbb{R}$ を持つマトロイド $(E, \mathcal{I})$ 上で、重みの大きい順に要素を貪欲に選ぶと、**最大重み基** が得られる。

**証明**:

貪欲法で得られた基を $G = \{g_1, g_2, \ldots, g_r\}$ ($w(g_1) \geq w(g_2) \geq \cdots \geq w(g_r)$)、任意の基を $B = \{b_1, b_2, \ldots, b_r\}$ ($w(b_1) \geq w(b_2) \geq \cdots \geq w(b_r)$) とする。

$w(G) < w(B)$ と仮定して矛盾を導く。$w(g_i) < w(b_i)$ となる最小の $i$ を取る。$A = \{g_1, \ldots, g_{i-1}\}$, $B' = \{b_1, \ldots, b_i\}$ とすると、$|A| < |B'|$ かつ両方とも独立なので、増大性 (I3) より $x \in B' \setminus A$ が存在して $A \cup \{x\} \in \mathcal{I}$ となる。

$x \in B'$ なので $w(x) \geq w(b_i) > w(g_i)$ である。しかし貪欲法はステップ $i$ で独立性を保つ中で最大重みの要素を選んでいるので、$w(g_i) \geq w(x)$ でなければならない。これは矛盾である。 $\square$

**逆の定理**: 任意の重み関数に対して貪欲法が最適解を与えるような遺伝的集合族は、マトロイドに他ならない。つまり、マトロイドは貪欲法で解ける構造を**完全に特徴づけている**。

### 実装

```python title="greedy_matroid.py"
def greedy_matroid(elements, weights, is_independent):
    # Sort elements by weight in descending order
    sorted_elems = sorted(zip(weights, elements), reverse=True)
    selected = set()
    for w, e in sorted_elems:
        if is_independent(selected | {e}):
            selected.add(e)
    return selected
```

### 具体例: Kruskal のアルゴリズム

最小全域木を求める Kruskal のアルゴリズムは、グラフィックマトロイド上の貪欲法に他ならない。

- 台集合 $E$: グラフの辺集合
- 独立集合: 森 (閉路を含まない辺集合)
- 重み: 辺の重み (最小全域木では重みの小さい順に貪欲法を適用)

```python title="kruskal.py"
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return False
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1
        return True

def kruskal(n, edges):
    # edges: list of (weight, u, v)
    edges.sort()
    uf = UnionFind(n)
    mst = []
    for w, u, v in edges:
        if uf.union(u, v):
            mst.append((w, u, v))
    return mst
```

独立性判定 (閉路を作らないか) を Union-Find で $O(\alpha(n))$ で行えるため、全体の計算量は $O(m \log m)$ ($m$ は辺数) である。

## マトロイドの双対

### 定義

マトロイド $M = (E, \mathcal{I})$ の**双対マトロイド** $M^* = (E, \mathcal{I}^*)$ は次のように定義される:

$$
\mathcal{I}^* = \{ A \subseteq E \mid E \setminus A \text{ は } M \text{ の基を含む} \}
$$

すなわち、$A$ が $M^*$ で独立であるとは、$A$ の補集合が $M$ のある基を含むことである。

### 双対の性質

- $M^*$ もマトロイドである
- $(M^*)^* = M$ (双対の双対は元のマトロイド)
- $M$ の基 $B$ に対して、$E \setminus B$ は $M^*$ の基
- $r^*(A) = |A| - r(E) + r(E \setminus A)$ (双対のランク関数)

### 具体例: グラフの双対

グラフィックマトロイドの双対は**コグラフィックマトロイド**と呼ばれる。平面グラフの場合、これは双対グラフのグラフィックマトロイドに一致する。

最小全域木問題に対して、双対マトロイドの視点では「最大重みの余木 (全域木に含まれない辺集合) の最大化」に対応する。

## 重み付き最適化とRadoの定理

### Rado の定理

マトロイド $M = (E, \mathcal{I})$ と重み関数 $w: E \to \mathbb{R}$ に対して:

$$
\max_{S \in \mathcal{I}} w(S) = \max_{B: \text{base}} w(B)
$$

ただし、負の重みの要素は基に含めなくてもよい場合は、最大重み独立集合を直接考える。具体的には:

1. 全要素の重みが非負なら、最大重み独立集合は最大重み基に一致する
2. 負の重みの要素がある場合、貪欲法で正の重みの要素のみを対象にする

### 最大重み独立集合の貪欲法

```python title="weighted_matroid_optimization.py"
def max_weight_independent_set(elements, weights, is_independent):
    # Consider only non-negative weight elements
    candidates = [(w, e) for w, e in zip(weights, elements) if w >= 0]
    candidates.sort(reverse=True)
    selected = set()
    for w, e in candidates:
        if is_independent(selected | {e}):
            selected.add(e)
    return selected
```

## 計算量

貪欲法は $O(n \log n + n \cdot f(n))$ で動作する。ここで $f(n)$ は独立性判定の計算量である。

| マトロイドの種類 | 独立性判定の計算量 | 貪欲法全体 |
|---|---|---|
| 一様マトロイド | $O(1)$ | $O(n \log n)$ |
| グラフィックマトロイド | $O(\alpha(n))$ (Union-Find) | $O(n \log n)$ |
| 線形マトロイド | $O(r^2)$ (ガウス消去) | $O(n(r^2 + \log n))$ |
| 分割マトロイド | $O(1)$ | $O(n \log n)$ |

## マトロイドのさらなる話題

### マトロイドのマイナー

マトロイド $M = (E, \mathcal{I})$ に対して:

- **縮約 (contraction)**: 要素 $e$ を含む独立集合について $e$ を「消す」操作
- **削除 (deletion)**: 要素 $e$ を台集合から除く操作

これらの操作で得られるマトロイドを**マイナー**という。マトロイドのマイナー理論はグラフのマイナー理論と深い関係がある。

### マトロイド和 (matroid union)

2つのマトロイド $M_1 = (E, \mathcal{I}_1)$, $M_2 = (E, \mathcal{I}_2)$ の和は:

$$
\mathcal{I} = \{ A_1 \cup A_2 \mid A_1 \in \mathcal{I}_1, A_2 \in \mathcal{I}_2, A_1 \cap A_2 = \emptyset \}
$$

マトロイド和もまたマトロイドとなる (Edmonds の定理)。

## まとめ

| 項目 | 内容 |
|------|------|
| 核心 | 貪欲法の正当性を保証する構造 |
| 3公理 | 空集合、遺伝性、増大性 |
| 同値な公理系 | ランク公理、閉包公理 |
| 代表例 | 一様、グラフィック、線形、分割、横断 |
| 貪欲法の計算量 | $O(n \log n + n \cdot f(n))$ |
| 双対 | 補集合が基を含む集合が独立 |
| 応用 | 最小全域木 (Kruskal)、スケジューリング、マトロイド交差 |
