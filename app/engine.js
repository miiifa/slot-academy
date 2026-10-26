import { advanceRules } from "./machine-rules.js";
import { machines } from "./machines.js";
export const roles = ["ハズレ", "ベル", "リプレイ", "チェリー", "スイカ"];
export class Simulator {
  constructor(machine = "sao2", random = Math.random) {
    this.random = random;
    this.reset(machine);
  }
  reset(machine = this.machine.id) {
    if (!machines[machine]) throw Error("不明な機種");
    this.machine = machines[machine];
    this.s = {
      machine,
      phase: this.machine.start,
      cycle: "ready",
      credit: 300,
      total: 0,
      g: 0,
      remaining: this.machine.nodes[this.machine.start].limit,
      stopped: [],
      order: [],
      role: null,
      replay: false,
      stake: 0,
      paid: 0,
      aim: true,
      upperRight: false,
      scWins: 0,
      boosts: 0,
      history: [],
      lastEnd: null,
      forced: null,
      outcome: "random",
      message: "BETで3枚を投入 → レバーで成立役を抽選 → 停止操作で入賞を確認。",
    };
    return this.s;
  }
  practiceReturnFinal(role = "ベル") {
    if (this.machine.id !== "sao2") return false;
    this.jump("return");
    this.s.g = 49;
    this.s.remaining = 1;
    this.force(role);
    this.s.message =
      "50G目から練習開始。49G分の実消化や出玉は付与しません。レア役の濃厚!?を100%とは扱わず、90%の教材仮抽選で比較します。";
    return true;
  }
  get node() {
    return this.machine.nodes[this.s.phase];
  }
  enter(phase, reason, { resume = false } = {}) {
    if (!this.machine.nodes[phase]) throw Error("不明な状態");
    const s = this.s;
    const from = s.phase;
    s.phase = phase;
    s.g = 0;
    s.remaining = this.machine.nodes[phase].limit;
    s.boosts = 0;
    if (phase === "at") {
      if (!resume) s.scWins = 0;
      s.upperRight = s.scWins >= 3;
    }
    if (phase === "normal") {
      s.scWins = 0;
      s.upperRight = false;
    }
    s.history.unshift({ from, to: phase, reason, total: s.total });
    s.history = s.history.slice(0, 8);
    s.message = reason;
  }
  jump(phase) {
    if (!this.machine.nodes[phase]) return false;
    const s = this.s;
    if (s.cycle === "bet") s.credit += s.stake;
    if (s.cycle === "spin") {
      s.credit += s.stake;
    }
    s.cycle = "ready";
    s.stake = 0;
    s.replay = false;
    s.role = null;
    s.stopped = [];
    s.order = [];
    s.paid = 0;
    s.upperRight = false;
    s.scWins = 0;
    this.enter(
      phase,
      "練習移動：未完了のBETは返却。実機では任意に移動できません。",
    );
    return true;
  }
  bet() {
    const s = this.s;
    if (s.cycle !== "ready") return false;
    const cost = s.replay ? 0 : this.machine.model.bet;
    if (s.credit < cost) {
      s.message = "架空コイン不足。リセットで無料補充できます。";
      return false;
    }
    s.credit -= cost;
    s.stake = cost;
    s.replay = false;
    s.paid = 0;
    s.role = null;
    s.stopped = [];
    s.order = [];
    s.aim = true;
    s.cycle = "bet";
    s.message = cost
      ? "3枚BET済み。レバーで内部抽選します。"
      : "リプレイ：追加投入なし。レバーへ。";
    return true;
  }
  force(role) {
    if (!roles.includes(role) || this.s.cycle === "spin") return false;
    this.s.forced = role;
    return true;
  }
  lever() {
    const s = this.s;
    if (s.cycle !== "bet") return false;
    const r = this.random();
    const at = ["at", "upper", "bonus"].includes(s.phase);
    const thresholds = at ? [0.65, 0.75, 0.85, 0.9] : [0.25, 0.45, 0.55, 0.65];
    s.role =
      s.forced ||
      (r < thresholds[0]
        ? "ベル"
        : r < thresholds[1]
          ? "リプレイ"
          : r < thresholds[2]
            ? "チェリー"
            : r < thresholds[3]
              ? "スイカ"
              : "ハズレ");
    s.forced = null;
    s.cycle = "spin";
    s.stopped = [false, false, false];
    s.order = [];
    s.message =
      "レバーで成立役が決まりました。左→中→右の順番を練習（実機の制御は再現しません）。";
    return true;
  }
  stop(index, aim = this.s.aim) {
    const s = this.s;
    if (s.cycle !== "spin" || ![0, 1, 2].includes(index) || s.stopped[index])
      return false;
    s.aim = aim;
    s.stopped[index] = true;
    s.order.push(index);
    if (s.stopped.every(Boolean)) this.finish();
    return true;
  }
  success(p) {
    return (
      this.s.outcome === "success" ||
      (this.s.outcome === "random" && this.random() < p)
    );
  }
  finish() {
    const s = this.s,
      m = this.machine.model;
    const phase = s.phase;
    const role = s.role;
    const at = ["at", "upper", "bonus"].includes(phase);
    const ordered = s.order.join("") === "012";
    let paid =
      role === "ベル"
        ? phase === "upper"
          ? m.upperBell
          : at
            ? m.atBell
            : m.bell
        : role === "チェリー"
          ? m.cherry
          : role === "スイカ"
            ? m.watermelon
            : 0;
    const caught = role !== "スイカ" || (s.aim && ordered);
    if (!caught) paid = 0;
    s.paid = paid;
    s.credit += paid;
    s.replay = role === "リプレイ";
    s.total++;
    s.g++;
    s.remaining = Math.max(0, s.remaining - 1);
    s.cycle = "ready";
    s.message =
      `成立役：${role}。${role === "ハズレ" ? "入賞なし" : role === "リプレイ" ? "再遊技の成立" : caught ? "教材の停止形で入賞判定" : "スイカの取りこぼし例"}。払い出し${paid}枚／今回差引${paid - s.stake}枚。` +
      (s.replay ? "次Gは追加投入なし。" : "") +
      (!ordered
        ? " 停止順は左→中→右と異なりました。実機の押し順ペナルティは再現していません。"
        : "");
    advanceRules[this.machine.id](this);
  }

  endAT(reason) {
    this.s.lastEnd = {
      total: this.s.total,
      credit: this.s.credit,
      from: this.s.phase,
      scWins: this.s.scWins,
    };
    this.enter("return", reason);
  }
}
