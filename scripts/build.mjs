import { mkdirSync, cpSync, rmSync } from "node:fs";
// 配信専用ディレクトリ。Git情報・テスト・依存パッケージを公開しない。
rmSync("_site", { recursive: true, force: true });
mkdirSync("_site");
for (const name of ["index.html", "advanced.html", ".nojekyll", "app", "docs", "demo", "draft"])
  cpSync(name, "_site/" + name, { recursive: true });
console.log("Static site staged in _site");
