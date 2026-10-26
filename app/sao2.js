// 出典本文を2026-10-26に閲覧。公式の存在確認と解析サイトの調査値を区別する。
const checked = "2026-10-26";
const analysis = (id, name, path, updated) => ({
  id,
  name: "一撃｜" + name,
  url: "https://1geki.jp/slot/l_sao2/" + path,
  checked,
  attempted: checked,
  updated,
  status: "解析サイト本文を照合（自社調査値・推察を含む）",
  kind: "analysis",
});
export const sources = [
  {
    id: "official",
    name: "大都技研｜SAO2製品サイト",
    url: "https://www.daitogiken.com/contents/product/slot/sao2/",
    checked,
    attempted: checked,
    status: "製品サイトの機種名と存在を確認。画像内の数値は未転記",
    kind: "official",
  },
  analysis("1geki", "機種概要・スペック", "", "2026-10-20"),
  analysis("reels", "打ち方・レア役の停止形", "2/", "2026-07-15"),
  analysis("ceiling", "天井・リセット・やめどき", "3/", "2026-08-20"),
  analysis("mode", "モード・ゾーン", "45/", "2026-10-20"),
  analysis("ggo", "GGOモード", "53/", "2026-10-05"),
  analysis("cz", "スコードロンバトル", "55/", "2026-07-10"),
  analysis("at", "バレットオブバレッツ", "81/", "2026-09-11"),
  analysis("sc", "狙撃手CHANCE", "83/", "2026-07-02"),
  analysis("uppercz", "デス・ガンバトル", "89/", "2026-07-10"),
  analysis("return", "AT引き戻し抽選", "90/", "2026-07-02"),
  analysis("upper", "バレットオブバレッツ フルダイブ", "91/", "2026-08-10"),
  analysis("hints", "AT終了画面・ボイス", "10/", "2026-09-18"),
  {
    id: "nana",
    name: "なな徹｜SAO2（補助照合先）",
    url: "https://nana-press.com/kaiseki/machine/1158/",
    checked: null,
    attempted: checked,
    status: "HTTP 403で本文未確認。確認済み情報の根拠には使用しない",
    kind: "unverified",
  },
];
export const settingSpecs = [
  [1, "1/238.4", "1/386.2", "97.6%"],
  [2, "1/232.3", "1/364.3", "98.8%"],
  [3, "1/232.7", "1/368.1", "100.2%"],
  [4, "1/218.9", "1/326.8", "105.3%"],
  [5, "1/225.2", "1/340.6", "110.4%"],
  [6, "1/191.7", "1/269.6", "114.9%"],
];
export const sao2Facts = [
  ["通常AT", "差枚数管理／初期150枚＋α／純増約3.6枚/G", ["at"]],
  ["上位AT", "FULL DIVE／純増約7.2枚/G。主に終了後は上位CZへ", ["upper"]],
  ["CZ", "前半10G＋ジャッジ4G／成功期待度約55%", ["cz"]],
  [
    "上位CZ",
    "バトル5G＋ジャッジ1G／成功期待度約50%。勝利で上位特化ゾーンを経由し上位ATへ",
    ["uppercz"],
  ],
  [
    "ラストアタック",
    "差枚数消化後のSC高確率5G。1〜4Gはレア役、5Gは中リール中段バレット停止でSC獲得濃厚!?",
    ["at"],
  ],
  [
    "引き戻し入口",
    "ラストアタックチャンス失敗後、デス・ガンバトル失敗後など",
    ["return"],
  ],
  [
    "引き戻し区間",
    "終了後50G間は全役で抽選。50G目レア役は引き戻し濃厚!?（断定しない）",
    ["return"],
  ],
  ["引き戻し成功", "初期150枚のATへ復帰。移行前のSC勝利数を保持", ["return"]],
  ["実Gの天井", "CZ間最大499G＋αでCZ／AT間最大1200G＋αでAT", ["ceiling"]],
  ["液晶Gの天井", "最大800G＋αでCZ。モードにより異なる", ["ceiling", "mode"]],
  [
    "設定変更時",
    "CZ実G天井256G＋αに短縮。電源OFF/ONだけとは異なる",
    ["ceiling"],
  ],
  [
    "初回上位CZ失敗後",
    "CZ実G天井256G＋αへの短縮を記載。初回条件を確認し、上位終了の全経路に一律適用しない",
    ["ceiling"],
  ],
  [
    "基本の打ち方",
    "ナビを優先。ナビなし通常時は左1st、左BAR狙い、スイカ停止時は中BARを目安にスイカを狙い右フリー",
    ["reels"],
  ],
  [
    "未判明・未再現",
    "引き戻しの役別確率・告知の遅れ、全リール制御、取りこぼし時の厳密な扱い等は未再現。未確認値は実機値として補完しない",
    [],
  ],
];
