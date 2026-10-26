// 実機情報と教材のパラメーターを同じフィールドに入れない。
import { sources, sao2Facts, settingSpecs } from "./sao2.js";
export { sources };
const saoNodes = {
  normal: {
    name: "通常時",
    limit: 8,
    goal: "教材の8G目、またはレア役の教材抽選でCZへ",
    chapter: "s-normal",
  },
  cz: {
    name: "CZ｜スコードロンバトル",
    limit: 5,
    goal: "教材の最終Gで成功・失敗を判定",
    chapter: "s-cz",
  },
  at: {
    name: "AT｜Bullet of Bullets",
    limit: 8,
    goal: "教材ゲージを消化。レア役で上乗せ・上位CZ権利",
    chapter: "s-at",
  },
  last: {
    name: "ラストアタック（教材）",
    limit: 5,
    goal: "教材最終GでAT再開、失敗ならAT終了後へ",
    chapter: "s-return",
  },
  uppercz: {
    name: "上位CZ｜デス・ガンバトル",
    limit: 3,
    goal: "教材最終Gで上位ATへの成功・失敗判定",
    chapter: "s-upper",
  },
  upper: {
    name: "上位AT｜FULL DIVE",
    limit: 8,
    goal: "教材ゲージ消化後は上位CZへ再挑戦",
    chapter: "s-upper",
  },
  return: {
    name: "AT終了後｜引き戻し練習",
    limit: 50,
    goal: "教材では各Gで抽選。50G終了時に通常時へ",
    chapter: "s-return",
  },
};
export const machines = {
  sao2: {
    id: "sao2",
    name: "SAO2を題材にした教材",
    fictional: false,
    description:
      "ゲームフローの理解用。実機の内部制御・確率・差枚数管理を再現しません。",
    nodes: saoNodes,
    start: "normal",
    edges: [
      ["normal", "cz", "レア役・教材8G"],
      ["normal", "at", "教材の直撃練習"],
      ["cz", "at", "成功"],
      ["cz", "normal", "失敗"],
      ["at", "uppercz", "挑戦権あり"],
      ["at", "last", "権利なし・ゲージ終了"],
      ["last", "at", "再開"],
      ["last", "return", "AT終了"],
      ["uppercz", "upper", "成功"],
      ["uppercz", "return", "失敗後の教材経路"],
      ["upper", "uppercz", "ゲージ終了"],
      ["return", "at", "引き戻し成功"],
      ["return", "normal", "50Gで非当選"],
    ],
    model: {
      bet: 3,
      bell: 8,
      watermelon: 3,
      cherry: 2,
      atBell: 9,
      upperBell: 12,
      czSuccess: 0.55,
      upperSuccess: 0.5,
      lastSuccess: 0.3,
      returnChance: 0.012,
      returnFinalRareChance: 0.9,
      normalRareChance: 0.3,
    },
    factNote:
      "実機情報は2026-10-26に一撃の解析本文と照合。解析サイトの調査値・濃厚!?という表現を保持し、メーカー公表値と混同しません。デモの確率・Gゲージ・払い出し・SC処理は教材用です。役別の引き戻し確率等は未判明で、実機のやめどき判断には使えません。",
    facts: sao2Facts,
    settingSpecs,
    sources: sources.map((s) => s.id),
  },
  lab: {
    id: "lab",
    name: "架空教材機｜リールラボ",
    fictional: true,
    description:
      "実在しない比較用機種。通常→ボーナス→通常の構成で、小役の取りこぼしを学びます。",
    start: "normal",
    nodes: {
      normal: {
        name: "通常時",
        limit: 6,
        goal: "教材6G目にボーナスへ",
        chapter: "b-aim",
      },
      bonus: {
        name: "教材ボーナス",
        limit: 4,
        goal: "教材4G消化で通常時へ",
        chapter: "b-bonus",
      },
    },
    edges: [
      ["normal", "bonus", "教材6G"],
      ["bonus", "normal", "4G終了"],
    ],
    model: {
      bet: 3,
      bell: 8,
      watermelon: 6,
      cherry: 2,
      atBell: 8,
      upperBell: 8,
    },
    factNote:
      "すべて架空の教材設定。実在機種の解析値ではありません。スイカを狙わなければ6枚の払い出しを失うモデルです。",
    facts: [
      ["種類", "架空のボーナス教材"],
      ["スイカ払い出し", "教材6枚／取りこぼし0枚"],
      ["ゲームフロー", "通常6G→ボーナス4G→通常"],
    ],
    sources: [],
  },
};
