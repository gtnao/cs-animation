---
title: "Undo可能データ構造 解説"
---

## Undo可能データ構造とは

Undo可能データ構造は、通常のデータ構造に**操作の取り消し (Undo)** 機能を追加したものである。最後に行った操作を逆転させて、1つ前の状態に戻すことができる。

## 設計パターン

### 1. 操作履歴スタック

各操作の逆操作を履歴スタックに保存する。Undo 時に逆操作を実行する。

```python title="undoable_stack.py"
class UndoableStack:
    def __init__(self):
        self.data = []
        self.history = []
    
    def push(self, val):
        self.data.append(val)
        self.history.append(('push', val))
    
    def pop(self):
        if not self.data:
            return None
        val = self.data.pop()
        self.history.append(('pop', val))
        return val
    
    def undo(self):
        if not self.history:
            return
        op, val = self.history.pop()
        if op == 'push':
            self.data.pop()
        elif op == 'pop':
            self.data.append(val)
```

### 2. スナップショット方式

状態全体をコピーして保存する。メモリを多く使うが実装が簡単。

### 3. 永続データ構造

状態を破壊せず全バージョンを保持する。Undo は古いバージョンへの参照切り替え。

## 計算量

| 方式 | Undo の計算量 | 空間計算量 |
|------|-------------|-----------|
| 逆操作スタック | $O(1)$ | $O(Q)$ |
| スナップショット | $O(1)$ (参照切替) | $O(Q \cdot S)$ |
| 永続データ構造 | $O(1)$ | $O(Q \log N)$ |

## 応用

- **Rollback可能Union-Find**: Union の逆操作を履歴保存
- **テキストエディタ**: 編集操作のUndo/Redo
- **ゲーム木の探索**: 手を進める/戻す

## まとめ

| 項目 | 内容 |
|------|------|
| 核心 | 逆操作の保存と実行 |
| 主要パターン | 逆操作スタック、スナップショット、永続化 |
