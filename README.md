# snowboard-gear 開発メモ

## Git / GitHub 基本ルーティーン

### 作業開始
git status

### 変更を保存（必ずこの順）
git add .
git commit -m "変更内容を書く"
git push

### よくある注意
- commit だけで安心しない（push忘れ注意）
- push したか GitHub で必ず確認する



  #今後のレビュー方法は「これ」でいきましょう

  #方法A（いちばん確実・おすすめ）
  👉 変更点を commit メッセージ単位で説明してもらう

  例：

  「⑱で main.js に商品IDを追加し、
  detail.html でURLパラメータを受け取る処理を書きました」