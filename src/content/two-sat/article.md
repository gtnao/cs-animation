---
title: "2-SAT 解説"
---

## 2-SAT とは

**2-SAT (2-satisfiability)** は、ブール変数 $x_1, x_2, \ldots, x_n$ に対する論理式が充足可能かを判定する問題である。論理式は**連言標準形 (CNF)** で与えられ、各節 (clause) が高々 2 つのリテラルからなる。

### 定義

2-SAT の入力は以下の形の論理式である:

$$
\varphi = (l_1 \lor l_2) \land (l_3 \lor l_4) \land \cdots \land (l_{2m-1} \lor l_{2m})
$$

ここで各 $l_i$ はリテラル ($x_j$ または $\lnot x_j$) である。

$\varphi$ を真にする変数の割り当てが存在するかを判定し、存在する場合はその割り当てを求める。

### 3-SAT との違い

一般の SAT (各節が任意個のリテラル) や 3-SAT (各節が高々 3 リテラル) は NP 完全であるが、2-SAT は多項式時間で解ける。

## 含意グラフ

### 節から含意への変換

節 $(a \lor b)$ は以下の 2 つの含意 (implication) と等価である:

$$
(\lnot a \Rightarrow b) \quad \text{かつ} \quad (\lnot b \Rightarrow a)
$$

直感的には、$a$ が偽なら $b$ は真でなければならず、$b$ が偽なら $a$ は真でなければならない。

### 含意グラフの構成

各変数 $x_i$ に対して 2 つのノード $x_i$ と $\lnot x_i$ を作る。合計 $2n$ ノードのグラフとなる。

各節 $(a \lor b)$ に対して:
- 辺 $\lnot a \to b$ を追加
- 辺 $\lnot b \to a$ を追加

このグラフを**含意グラフ (implication graph)** と呼ぶ。

### 例

節: $(x_0 \lor x_1)$, $(\lnot x_0 \lor x_2)$, $(\lnot x_1 \lor \lnot x_2)$

含意辺:
- $(x_0 \lor x_1)$: $\lnot x_0 \to x_1$, $\lnot x_1 \to x_0$
- $(\lnot x_0 \lor x_2)$: $x_0 \to x_2$, $\lnot x_2 \to \lnot x_0$
- $(\lnot x_1 \lor \lnot x_2)$: $x_1 \to \lnot x_2$, $x_2 \to \lnot x_1$

## SCC による充足可能性判定

### 定理

2-SAT 式 $\varphi$ が充足可能である必要十分条件は、含意グラフにおいて、どの変数 $x_i$ についても $x_i$ と $\lnot x_i$ が同じ強連結成分 (SCC) に属さないことである。

**証明 (必要性):**

$x_i$ と $\lnot x_i$ が同じ SCC に属するとする。このとき $x_i \Rightarrow^* \lnot x_i$ かつ $\lnot x_i \Rightarrow^* x_i$ というパスが存在する。$x_i$ が真なら含意を辿って $\lnot x_i$ が真 (矛盾)、$x_i$ が偽なら $\lnot x_i$ が真で含意を辿って $x_i$ が真 (矛盾)。よって充足不能。

**証明 (十分性):**

$x_i$ と $\lnot x_i$ が常に異なる SCC に属するとする。SCC を縮約した DAG 上でトポロジカル順序を考え、$\text{scc}(x_i) > \text{scc}(\lnot x_i)$ (トポロジカル順序で後) のとき $x_i = \text{true}$ と設定すると、矛盾なく割り当てが構成できる。 $\square$

### アルゴリズムの手順

1. 含意グラフを構築する
2. SCC を求める (Kosaraju または Tarjan)
3. 各変数 $x_i$ について $\text{scc}(x_i) = \text{scc}(\lnot x_i)$ なら充足不能
4. 充足可能なら、$x_i = [\text{scc}(x_i) > \text{scc}(\lnot x_i)]$ で割り当て

### 実装

```python title="two_sat.py"
def solve_2sat(n: int, clauses: list[tuple[int, int]]) -> list[bool] | None:
    """
    n: number of variables
    clauses: list of (a, b) where a, b are literal indices
             literal 2*i = x_i, literal 2*i+1 = !x_i
    """
    num_lits = 2 * n
    adj = [[] for _ in range(num_lits)]
    radj = [[] for _ in range(num_lits)]

    for a, b in clauses:
        # (a OR b) => (!a -> b) and (!b -> a)
        adj[a ^ 1].append(b)
        adj[b ^ 1].append(a)
        radj[b].append(a ^ 1)
        radj[a].append(b ^ 1)

    # Kosaraju's SCC
    visited = [False] * num_lits
    order = []

    def dfs1(u: int) -> None:
        stack = [(u, 0)]
        visited[u] = True
        while stack:
            node, idx = stack[-1]
            if idx < len(adj[node]):
                stack[-1] = (node, idx + 1)
                v = adj[node][idx]
                if not visited[v]:
                    visited[v] = True
                    stack.append((v, 0))
            else:
                order.append(node)
                stack.pop()

    for i in range(num_lits):
        if not visited[i]:
            dfs1(i)

    comp = [-1] * num_lits
    num_comp = 0

    def dfs2(u: int, c: int) -> None:
        stack = [u]
        comp[u] = c
        while stack:
            node = stack.pop()
            for v in radj[node]:
                if comp[v] == -1:
                    comp[v] = c
                    stack.append(v)

    for i in reversed(order):
        if comp[i] == -1:
            dfs2(i, num_comp)
            num_comp += 1

    # Check satisfiability
    for i in range(n):
        if comp[2 * i] == comp[2 * i + 1]:
            return None  # unsatisfiable

    # Assign values
    return [comp[2 * i] > comp[2 * i + 1] for i in range(n)]
```

## 計算量

| 項目 | 計算量 |
|------|--------|
| 含意グラフ構築 | $O(m)$ |
| SCC 計算 | $O(n + m)$ |
| 全体 | $O(n + m)$ |

$n$ は変数数、$m$ は節数である。

## 2-SAT の応用

### よくある定式化パターン

| パターン | 節 |
|----------|-----|
| $x_i$ は真 | $(x_i \lor x_i)$ |
| $x_i$ と $x_j$ のうち少なくとも一方が真 | $(x_i \lor x_j)$ |
| $x_i$ と $x_j$ は同時に真にならない | $(\lnot x_i \lor \lnot x_j)$ |
| $x_i$ が真なら $x_j$ も真 | $(\lnot x_i \lor x_j)$ |
| $x_i$ と $x_j$ は同値 | $(\lnot x_i \lor x_j) \land (x_i \lor \lnot x_j)$ |

### 競技プログラミングでの典型

- 「各ペアから少なくとも 1 つ選ぶ」制約
- 「2 つの選択肢のうち片方を選ぶ」制約
- グラフの辺の向き付け問題
- スケジューリング問題

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n$ 変数 $m$ 節の 2-CNF |
| 出力 | 充足可能性判定と割り当て |
| 時間計算量 | $O(n + m)$ |
| 空間計算量 | $O(n + m)$ |
| 核心 | 含意グラフの SCC 分解 |
| 応用 | 制約充足、スケジューリング |
