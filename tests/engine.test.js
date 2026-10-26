import test from "node:test";
import assert from "node:assert/strict";
import { Simulator } from "../app/engine.js";
const game = (s, role = "ハズレ", aim = true, order = [0, 1, 2]) => {
  assert.equal(s.bet(), true);
  s.force(role);
  assert.equal(s.lever(), true);
  order.forEach((i) => assert.equal(s.stop(i, aim), true));
};
test("操作ガード・レバー時の成立役・1Gの投入と払出", () => {
  const d = new Simulator();
  assert.equal(d.lever(), false);
  assert.equal(d.stop(0), false);
  d.force("ベル");
  assert.equal(d.bet(), true);
  assert.equal(d.bet(), false);
  assert.equal(d.s.credit, 297);
  d.lever();
  assert.equal(d.s.role, "ベル");
  assert.equal(d.s.total, 0);
  d.stop(0);
  assert.equal(d.stop(0), false);
  d.stop(1);
  assert.equal(d.s.credit, 297);
  d.stop(2);
  assert.equal(d.s.credit, 305);
  assert.equal(d.s.total, 1);
  assert.equal(d.s.cycle, "ready");
  assert.equal(d.stop(2), false);
});
test("リプレイは次Gの追加投入なし", () => {
  const d = new Simulator();
  game(d, "リプレイ");
  assert.equal(d.s.credit, 297);
  d.bet();
  assert.equal(d.s.credit, 297);
  assert.equal(d.s.stake, 0);
});
test("架空機の目押し比較・役は変化しない", () => {
  const a = new Simulator("lab"),
    b = new Simulator("lab");
  game(a, "スイカ", true);
  game(b, "スイカ", false);
  assert.equal(a.s.role, b.s.role);
  assert.equal(a.s.paid, 6);
  assert.equal(b.s.paid, 0);
  assert.equal(a.s.credit - b.s.credit, 6);
});
test("停止順比較は入賞結果だけに反映", () => {
  const d = new Simulator("lab");
  game(d, "スイカ", true, [2, 1, 0]);
  assert.equal(d.s.role, "スイカ");
  assert.equal(d.s.paid, 0);
  assert.match(d.s.message, /停止順/);
});
test("通常8G→CZ5G→成功ATと失敗通常", () => {
  for (const result of ["success", "failure"]) {
    const d = new Simulator();
    d.s.outcome = result;
    for (let i = 0; i < 8; i++) game(d);
    assert.equal(d.s.phase, "cz");
    for (let i = 0; i < 4; i++) game(d);
    assert.equal(d.s.phase, "cz");
    game(d);
    assert.equal(d.s.phase, result === "success" ? "at" : "normal");
    assert.equal(d.s.total, 13);
  }
});
test("ATの上乗せに上限・挑戦権で上位CZへ", () => {
  const d = new Simulator();
  d.jump("at");
  game(d, "チェリー");
  assert.equal(d.s.remaining, 9);
  assert.equal(d.s.upperRight, false);
  game(d, "チェリー");
  game(d, "チェリー");
  assert.equal(d.s.upperRight, true);
  assert.equal(d.s.scWins, 3);
  assert.equal(d.s.boosts, 2);
  assert.equal(d.s.remaining, 9);
  for (let i = 0; i < 9; i++) game(d);
  assert.equal(d.s.phase, "uppercz");
});
test("上位CZ成功→上位AT消化→再挑戦・失敗分岐", () => {
  const d = new Simulator();
  d.jump("uppercz");
  d.s.outcome = "success";
  for (let i = 0; i < 3; i++) game(d);
  assert.equal(d.s.phase, "upper");
  for (let i = 0; i < 8; i++) game(d);
  assert.equal(d.s.phase, "uppercz");
  d.s.outcome = "failure";
  for (let i = 0; i < 3; i++) game(d);
  assert.equal(d.s.phase, "return");
});
test("ラストアタック成功はAT再開・失敗は終了情報保存", () => {
  for (const result of ["success", "failure"]) {
    const d = new Simulator();
    d.jump("at");
    d.s.outcome = result;
    for (let i = 0; i < 8; i++) game(d);
    assert.equal(d.s.phase, "last");
    for (let i = 0; i < 5; i++) game(d);
    assert.equal(d.s.phase, result === "success" ? "at" : "return");
    if (result === "failure") assert.equal(d.s.lastEnd.total, 13);
  }
});
test("引き戻し49Gでは終了しない・50G非当選で通常", () => {
  const d = new Simulator();
  d.jump("return");
  d.s.outcome = "failure";
  for (let i = 0; i < 49; i++) game(d, "ベル");
  assert.equal(d.s.phase, "return");
  assert.equal(d.s.g, 49);
  assert.equal(d.s.remaining, 1);
  game(d, "ベル");
  assert.equal(d.s.phase, "normal");
  assert.equal(d.s.total, 50);
});
test("最終50Gの抽選成功は通常に落とさずAT・記録保持", () => {
  const d = new Simulator();
  d.endAT("テスト");
  const end = { ...d.s.lastEnd };
  d.s.outcome = "failure";
  for (let i = 0; i < 49; i++) game(d, "ベル");
  d.s.outcome = "success";
  game(d);
  assert.equal(d.s.phase, "at");
  assert.deepEqual(d.s.lastEnd, end);
  assert.equal(d.s.total, 50);
});
test("ランダム引き戻し判定の成功・失敗", () => {
  const win = new Simulator("sao2", () => 0),
    lose = new Simulator("sao2", () => 0.999);
  win.jump("return");
  lose.jump("return");
  game(win);
  game(lose);
  assert.equal(win.s.phase, "at");
  assert.equal(lose.s.phase, "return");
});
test("練習移動はBET返却・回転中も未完了Gを取消", () => {
  for (const spinning of [false, true]) {
    const d = new Simulator();
    d.bet();
    if (spinning) d.lever();
    d.jump("cz");
    assert.equal(d.s.credit, 300);
    assert.equal(d.s.total, 0);
    assert.equal(d.s.cycle, "ready");
    assert.equal(d.s.role, null);
    game(d);
    assert.equal(d.s.total, 1);
  }
});
test("機種切替・リセットは全状態を初期化", () => {
  const d = new Simulator();
  d.jump("upper");
  d.s.upperRight = true;
  d.s.outcome = "success";
  game(d, "ベル");
  d.reset("lab");
  assert.equal(d.s.credit, 300);
  assert.equal(d.s.total, 0);
  assert.equal(d.s.outcome, "random");
  assert.equal(d.s.history.length, 0);
  assert.equal(d.s.upperRight, false);
  assert.equal(d.jump("upper"), false);
  for (let i = 0; i < 6; i++) game(d, "ベル");
  assert.equal(d.s.phase, "bonus");
  for (let i = 0; i < 4; i++) game(d, "ベル");
  assert.equal(d.s.phase, "normal");
});
test("コイン不足・不正入力・無効ワープで壊さない", () => {
  const d = new Simulator();
  d.s.credit = 2;
  assert.equal(d.bet(), false);
  assert.equal(d.s.credit, 2);
  assert.equal(d.force("不明"), false);
  assert.equal(d.jump("不明"), false);
  d.reset();
  d.bet();
  d.lever();
  assert.equal(d.stop(4), false);
  assert.equal(d.force("ベル"), false);
});

test("AT中のランダム抽選でもレア役とSC勝利に到達する", () => {
  const d = new Simulator("sao2", () => 0.8);
  d.jump("at");
  d.bet();
  d.lever();
  assert.equal(d.s.role, "チェリー");
  [0, 1, 2].forEach((i) => d.stop(i));
  assert.equal(d.s.scWins, 1);
  assert.equal(d.s.upperRight, false);
  assert.equal(d.s.remaining, 9);
});

test("SC勝利数は終了後の引き戻し成功時に保持、新規ATで初期化", () => {
  const d = new Simulator();
  d.jump("at");
  game(d, "チェリー");
  assert.equal(d.s.scWins, 1);
  d.endAT("終了");
  assert.equal(d.s.lastEnd.scWins, 1);
  d.s.outcome = "success";
  game(d);
  assert.equal(d.s.phase, "at");
  assert.equal(d.s.scWins, 1);
  assert.equal(d.s.lastEnd.scWins, 1);
  d.enter("normal", "区間終了");
  assert.equal(d.s.scWins, 0);
  d.enter("at", "新規AT");
  assert.equal(d.s.scWins, 0);
});
test("最終Gレア役の90%教材抽選と通常Gの仮抽選は別", () => {
  for (const [role, random, expected] of [
    ["チェリー", 0.89, "at"],
    ["チェリー", 0.91, "normal"],
    ["スイカ", 0.5, "at"],
    ["ベル", 0.5, "normal"],
  ]) {
    const d = new Simulator("sao2", () => random);
    assert.equal(d.practiceReturnFinal(role), true);
    assert.equal(d.s.g, 49);
    assert.equal(d.s.remaining, 1);
    assert.equal(d.s.total, 0);
    assert.equal(d.bet(), true);
    d.lever();
    [0, 1, 2].forEach((i) => d.stop(i));
    assert.equal(d.s.phase, expected);
    assert.equal(d.s.total, 1);
  }
});
test("最終G練習は実消化・出玉を付与せず、架空機には適用しない", () => {
  const d = new Simulator();
  d.bet();
  d.practiceReturnFinal();
  assert.equal(d.s.credit, 300);
  assert.equal(d.s.total, 0);
  assert.equal(d.s.cycle, "ready");
  assert.equal(d.s.forced, "ベル");
  const lab = new Simulator("lab");
  assert.equal(lab.practiceReturnFinal(), false);
  assert.equal(lab.s.phase, "normal");
});
test("結果指定の失敗は最終Gレア役でも有効", () => {
  const d = new Simulator("sao2", () => 0);
  d.practiceReturnFinal("チェリー");
  d.s.outcome = "failure";
  game(d, "チェリー");
  assert.equal(d.s.phase, "normal");
});

test("引き戻し非当選で通常に戻るとSC数と古い上位CZ権利を解除", () => {
  const d = new Simulator();
  d.jump("return");
  d.s.scWins = 3;
  d.s.upperRight = true;
  d.s.outcome = "failure";
  d.s.g = 49;
  d.s.remaining = 1;
  game(d);
  assert.equal(d.s.phase, "normal");
  assert.equal(d.s.scWins, 0);
  assert.equal(d.s.upperRight, false);
});
