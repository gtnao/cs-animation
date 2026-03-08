---
title: "後退解析 (Retrograde Analysis) 解説"
---

## 後退解析とは

後退解析 (Retrograde Analysis) は、ゲームの **終了状態** から **逆方向** に辿ることで、全ての状態の勝敗を決定するアルゴリズムである。前向きの探索 (Minimax等) とは逆のアプローチをとる。

## 基本的なアイデア

### 前向き解析との対比

- **前向き解析 (Minimax):** 初期状態からゲーム木を展開して勝敗を判定
- **後退解析:** 終了状態 (既知の勝敗) から逆辺を辿り、全状態の勝敗を確定

### アルゴリズムの直感

1. 終了状態の勝敗は自明 (手が打てない = 負け)
2. 「相手が負ける状態」に遷移できるなら、自分は勝ち
3. 全ての遷移先が「相手が勝つ状態」なら、自分は負け

## アルゴリズム

### BFS ベースの後退解析

```python title="retrograde_analysis.py"
from collections import deque

def retrograde_analysis(states, transitions, terminal_states):
    """
    states: 全状態のリスト
    transitions: state -> [next_states] の辞書
    terminal_states: 終了状態のリスト (手番側の負け)
    """
    result = {}  # state -> 'W' or 'L'
    out_degree = {}  # 未確定の遷移先数

    # Initialize
    for s in states:
        out_degree[s] = len(transitions.get(s, []))

    queue = deque()

    # Mark terminal states as losses
    for s in terminal_states:
        result[s] = 'L'
        queue.append(s)

    # BFS backward
    while queue:
        s = queue.popleft()

        # Find predecessors (states that can reach s)
        for pred in predecessors(s):
            if pred in result:
                continue

            if result[s] == 'L':
                # Predecessor can move to a losing state -> predecessor wins
                result[pred] = 'W'
                queue.append(pred)
            elif result[s] == 'W':
                # Predecessor sees a winning successor
                out_degree[pred] -= 1
                if out_degree[pred] == 0:
                    # All successors are winning -> predecessor loses
                    result[pred] = 'L'
                    queue.append(pred)

    return result
```

### 手順の詳細

1. **初期化:** 終了状態を全て「負け (L)」としてキューに入れる
2. **勝ちの伝播:** 「負け」の状態への遷移がある前任状態は「勝ち (W)」
3. **負けの伝播:** 全ての遷移先が「勝ち」になった前任状態は「負け (L)」
4. **繰り返し:** キューが空になるまで

## 具体例: Subtraction Game

石が $n$ 個あり、$\{1, 2, 3\}$ 個取れるゲーム:

| $n$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|-----|---|---|---|---|---|---|---|---|---|
| 結果 | L | W | W | W | L | W | W | W | L |

後退解析の流れ:

1. $n=0$ は L (手が打てない)
2. $n=1,2,3$ は W ($n=0$ に遷移可能)
3. $n=4$ は L ($n=1,2,3$ は全て W)
4. $n=5,6,7$ は W ($n=4$ に遷移可能)
5. $n=8$ は L ($n=5,6,7$ は全て W)

## 計算量

状態数を $|S|$、遷移数を $|E|$ とすると:

$$
T = O(|S| + |E|)
$$

各状態は高々1回キューに入り、各遷移は高々1回処理されるため線形時間である。

## 前向き解析との比較

| 特性 | 前向き (Minimax) | 後退解析 |
|------|------------------|----------|
| 探索方向 | 初期状態 → 終了 | 終了 → 初期状態 |
| 全状態の解析 | 困難 (ゲーム木が巨大) | 効率的 |
| メモリ使用量 | 再帰スタック + メモ化 | 全状態のテーブル |
| 適用条件 | 任意のゲーム木 | 有限状態ゲーム |

## 応用

### チェスのエンドゲームテーブルベース

チェスのエンドゲーム (残り駒が少ない局面) の完全解析に後退解析が使われる。例えば:

- KRK (King + Rook vs King): 全ての局面の勝敗と最適手数を事前計算
- Syzygy テーブルベース: 7駒以下の全エンドゲームが解析済み

### その他のゲーム

- 将棋やチェッカーの部分的な解析
- 小規模な組合せゲームの完全解析
- ゲームの必勝手数の計算

## まとめ

| 項目 | 内容 |
|------|------|
| 方向 | 終了状態から逆方向 |
| 時間計算量 | $O(\|S\| + \|E\|)$ |
| 空間計算量 | $O(\|S\|)$ |
| 適用条件 | 有限状態の不偏/偏ゲーム |
| 核心 | BFS による勝敗の逆伝播 |
