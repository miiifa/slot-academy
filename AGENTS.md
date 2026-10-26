# Slot Academy 固有ルール
共通ルールは `miiifa/project-starter/AGENTS.md` と `PROJECT_PLAYBOOK.md` を確認。Codex Cloud上に実際にセット配置されたか確認する。
- このアプリは教育専用。実機の確率・天井・払い出し仕様と学習用の仮値を分離して表示する。
- 共通基礎編の後に機種別編を配置。小役・CZ・AT・引き戻し・終了判断まで説明する。
- Androidスマホ画面の操作性とフロー図の現在地更新を重視する。
- 著作権が不明な画像を再配布しない。出典・利用許可を記録する。
- `draft/index.html` は旧草案から現在の入口への案内。現在のアプリ入口はルートの `index.html`。
- ブランチ→PR→テスト→レビューを経て、承認前に勝手にmainへマージしない。
- 共通原本は、この配置では `../project-starter/AGENTS.md`。新規企画・大規模改修時は `../project-starter/PROJECT_PLAYBOOK.md` を読む。
- ローカル起動は `npm run serve`、検証は `npm test` と `npm run test:browser`。既存ブラウザーは `CHROMIUM_PATH` で指定可能。
- `app/machines.js` の `model` は教材用。実機の未確認値を `facts` に確定値として入れない。`sources.checked: null` は未照合。
- 静的配信は `node scripts/build.mjs` の `_site/` のみ。PRの検証とmainのPages配信を分離する。
