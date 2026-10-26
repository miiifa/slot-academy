// 機種固有の教材状態遷移。BET・停止・払出の共通処理はengine.js。
export const advanceRules = {
  lab(sim) {
    const s = sim.s,
      phase = s.phase;
    if (s.remaining === 0)
      sim.enter(
        phase === "normal" ? "bonus" : "normal",
        phase === "normal"
          ? "教材6G到達 → ボーナス"
          : "教材ボーナス4G終了 → 通常時",
      );
  },
  sao2(sim) {
    const s = sim.s,
      m = sim.machine.model,
      phase = s.phase,
      role = s.role;
    if (
      phase === "normal" &&
      (s.remaining === 0 ||
        (role === "チェリー" && sim.success(m.normalRareChance)))
    )
      sim.enter("cz", "教材のゲーム数／レア役抽選 → CZ");
    else if (phase === "cz" && s.remaining === 0)
      sim.enter(
        sim.success(m.czSuccess) ? "at" : "normal",
        "CZの教材最終Gで成功・失敗を判定",
      );
    else if (phase === "at" || phase === "upper") {
      if (role === "チェリー") {
        s.scWins++;
        s.message += " 教材SC勝利：通算" + s.scWins + "勝。";
        if (s.boosts < 2) {
          s.remaining += 2;
          s.boosts++;
          s.message += " ゲージ＋2G（上乗せは区間内最大2回）。";
        }
        if (phase === "at" && s.scWins >= 3) {
          s.upperRight = true;
          s.message += " 3勝で上位CZの教材挑戦権を獲得。";
        }
      }
      if (s.remaining === 0)
        sim.enter(
          phase === "upper" || s.upperRight ? "uppercz" : "last",
          phase === "upper"
            ? "上位AT終了 → 上位CZへ再挑戦"
            : s.upperRight
              ? "権利あり → 上位CZ"
              : "教材ATゲージ終了 → ラストアタック",
        );
    } else if (phase === "last" && s.remaining === 0) {
      if (sim.success(m.lastSuccess)) {
        s.scWins++;
        sim.enter(
          "at",
          "ラストアタックの教材SC獲得・勝利をまとめて体験 → AT再開",
          { resume: true },
        );
      } else sim.endAT("ラストアタック失敗 → AT終了後の教材区間");
    } else if (phase === "uppercz" && s.remaining === 0) {
      if (sim.success(m.upperSuccess))
        sim.enter("upper", "上位CZの教材判定成功 → FULL DIVE");
      else sim.endAT("上位CZの教材判定失敗 → 終了後の練習経路");
    } else if (phase === "return") {
      const finalRare = s.g === 50 && ["チェリー", "スイカ"].includes(role);
      const chance = finalRare ? m.returnFinalRareChance : m.returnChance;
      if (sim.success(chance))
        sim.enter(
          "at",
          (finalRare
            ? "50G目レア役の教材仮抽選成功"
            : "引き戻し区間の教材仮抽選成功") + " → AT復帰・SC勝利数を保持",
          { resume: true },
        );
      else if (s.remaining === 0)
        sim.enter(
          "normal",
          "教材50Gを非当選で消化 → 通常時（実機の前兆処理は未再現）",
        );
    }
  },
};
