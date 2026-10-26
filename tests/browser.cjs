const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--no-sandbox"],
  });
  const root = process.env.BASE_URL || "http://127.0.0.1:8000";
  fs.mkdirSync("test-results", { recursive: true });
  try {
    for (const width of [360, 390, 768, 1366]) {
      const page = await browser.newPage({
        viewport: { width, height: 844 },
        isMobile: width < 500,
        hasTouch: width < 500,
      });
      const errors = [];
      page.on("dialog", d=>d.accept());
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      await page.goto(root.replace(/\/$/, "")+"/advanced.html");
      await page.waitForSelector("#chapterContent h2");
      for (const view of [
        "learn",
        "sim",
        "machine",
        "words",
        "quiz",
        "resources",
      ]) {
        await page.locator(`[data-view="${view}"]`).click();
        await page.waitForSelector(`#view-${view}.active`);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
          view + " overflow " + width,
        );
      }
      await page.locator('[data-view="learn"]').click();
      await page.selectOption("#chapterSelect", "s-return");
      await page.waitForFunction(() =>
        document
          .querySelector("#chapterContent h2")
          .textContent.includes("26."),
      );
      await page.locator("#chapterContent summary").click();
      assert.ok(
        (await page.locator("#chapterContent details").getAttribute("open")) !==
          null,
      );
      await page.locator('[data-view="sim"]').click();
      await page.selectOption("#forceRole", "ベル");
      await page.click("#betBtn");
      assert.equal(await page.locator("#credit").textContent(), "297");
      assert.equal(await page.locator("#betBtn").isDisabled(), true);
      await page.click("#leverBtn");
      assert.match(await page.locator("#roleNote").textContent(), /ベル/);
      await page.click("#stop0");
      await page.click("#stop1");
      await page.click("#stop2");
      assert.equal(await page.locator("#totalG").textContent(), "1G");
      assert.equal(await page.locator("#credit").textContent(), "305");
      const play = async (role = "ベル") => {
        await page.selectOption("#forceRole", role);
        await page.click("#betBtn");
        await page.click("#leverBtn");
        for (let i = 0; i < 3; i++) await page.click("#stop" + i);
      };
      await page.selectOption("#outcome", "success");
      await page.locator('[data-phase="cz"]').click();
      for (let i = 0; i < 5; i++) await play();
      assert.match(await page.locator("#phaseName").textContent(), /^AT/);
      assert.equal(
        await page.locator('[data-phase="at"]').getAttribute("aria-current"),
        "step",
      );
      await page.selectOption("#outcome", "failure");
      for (let i = 0; i < 8; i++) await play();
      assert.match(
        await page.locator("#phaseName").textContent(),
        /ラストアタック/,
      );
      for (let i = 0; i < 5; i++) await play();
      assert.match(await page.locator("#whereCount").textContent(), /残り50G/);
      if (width === 390) {
        for (let i = 0; i < 49; i++) await play();
        assert.match(await page.locator("#whereCount").textContent(), /残り1G/);
        await play();
        assert.equal(await page.locator("#phaseName").textContent(), "通常時");
      }
      await page.locator('[data-phase="return"]').click();
      await page.selectOption("#outcome", "success");
      await play();
      assert.match(await page.locator("#phaseName").textContent(), /^AT/);
      await page.click("#relatedChapter");
      await page.waitForSelector("#view-learn.active");
      assert.match(
        await page.locator("#chapterContent h2").textContent(),
        /24\./,
      );
      await page.locator('[data-view="sim"]').click();
      await page.selectOption("#simMachine", "lab");
      assert.equal(await page.locator("#flowNodes button").count(), 2);
      assert.match(await page.locator("#simMachineName").textContent(), /架空/);
      await page.selectOption("#forceRole", "スイカ");
      await page.uncheck("#aim");
      await page.click("#betBtn");
      await page.click("#leverBtn");
      for (let i = 0; i < 3; i++) await page.click("#stop" + i);
      assert.match(await page.locator("#paid").textContent(), /払い出し：0枚/);
      assert.equal(await page.locator("#credit").textContent(), "297");
      await page.click("#resetBtn");
      assert.equal(await page.locator("#credit").textContent(), "300");
      assert.equal(await page.locator("#totalG").textContent(), "0G");
      await page.locator('[data-view="machine"]').click();
      assert.equal(await page.locator("#machineSelect").inputValue(), "lab");
      assert.match(
        await page.locator("#machineContent").textContent(),
        /通常6G/,
      );
      await page.selectOption("#machineSelect", "sao2");
      assert.equal(await page.locator("#simMachine").inputValue(),"lab");
      await page.locator("#machineContent a").filter({hasText:"選択した機種を操作する"}).click();
      await page.locator('[data-view="machine"]').click();
      assert.match(
        await page.locator("#machineContent").textContent(),
        /解析本文と照合/,
      );
      await page.locator('[data-view="sim"]').click();
      await page.click("#lastReturnBtn");
      assert.match(await page.locator("#whereCount").textContent(), /残り1G/);
      assert.equal(await page.locator("#forceRole").inputValue(), "ベル");
      await page.selectOption("#outcome", "failure");
      await play();
      assert.equal(await page.locator("#phaseName").textContent(), "通常時");
      await page.click("#rareReturnBtn");
      assert.equal(await page.locator("#forceRole").inputValue(), "チェリー");
      await page.selectOption("#outcome", "success");
      await page.click("#betBtn");
      await page.click("#leverBtn");
      for (let i = 0; i < 3; i++) await page.click("#stop" + i);
      assert.match(await page.locator("#phaseName").textContent(), /^AT/);
      await page.click("#resetBtn");
      await page.locator('[data-phase="at"]').click();
      await play("チェリー");
      assert.match(await page.locator("#scWins").textContent(), /1勝/);
      await page.selectOption("#outcome", "failure");
      for (let i = 0; i < 9; i++) await play();
      for (let i = 0; i < 5; i++) await play();
      assert.match(await page.locator("#phaseName").textContent(), /引き戻し/);
      assert.match(await page.locator("#lastEnd").textContent(), /SC 1勝/);
      await page.selectOption("#outcome", "success");
      await play();
      assert.match(await page.locator("#scWins").textContent(), /1勝/);
      await page.locator('[data-view="learn"]').click();
      await page.selectOption("#chapterSelect", "s-return");
      await page.waitForFunction(() =>
        document
          .querySelector("#chapterContent h2")
          .textContent.includes("26."),
      );
      assert.ok((await page.locator(".chapter-sources a").count()) >= 2);
      assert.match(await page.locator("#chapterContent").textContent(), /濃厚/);
      assert.match(
        await page.locator("#chapterContent").textContent(),
        /2026-10-26/,
      );
      await page.locator('[data-view="words"]').click();
      await page.fill("#termSearch", "純増");
      assert.ok((await page.locator("#glossary .term").count()) > 0);
      await page.fill("#termSearch", "zzzz");
      assert.match(await page.locator("#glossary").textContent(), /ありません/);
      await page.locator('[data-view="quiz"]').click();
      await page.locator("#choices button").first().click();
      assert.ok((await page.locator("#feedback").textContent()).length > 0);
      await page.click("#quizNext");
      assert.match(await page.locator("#quizCounter").textContent(), /^2 /);
      await page.click("#quizRestart");
      assert.match(await page.locator("#quizCounter").textContent(), /^1 /);
      await page.locator('[data-view="sim"]').click();
      await page.screenshot({
        path: `test-results/sim-${width}.png`,
        fullPage: true,
      });
      assert.deepEqual(errors, []);
      console.log(
        `PASS ${width}px: navigation, textbook, BET/lever/stops, CZ/AT/return, machine switch, glossary, quiz, no overflow/errors`,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
