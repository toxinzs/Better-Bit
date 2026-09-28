import { chromium } from "playwright";
const SHOTS = "/tmp/claude-0/-home-user-ClaudeCodeTest/b6c83874-1574-58d8-b675-af3d3ba8fa69/scratchpad/shots";
const which = process.argv[2] || "v1";
const years = parseInt(process.argv[3] || "32");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type()==="error") errors.push("console:"+m.text()); });
await page.goto("http://localhost:8081", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.evaluate(() => window.__store.setState({ screen: "start", character: null }));
await page.waitForTimeout(300);
await page.getByPlaceholder(/First name/i).fill("Jordan");
await page.getByPlaceholder(/Last name/i).fill("Ellis");
await page.getByRole("button", { name: /Begin Life/i }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${SHOTS}/${which}-00-birth.png` });
for (let i = 0; i < years; i++) {
  await page.evaluate(() => {
    const s = window.__store.getState();
    if (!s.character?.alive) return;
    s.ageUp();
    let g = 0;
    while (window.__store.getState().pendingEvent && g++ < 6) window.__store.getState().chooseEventOption(0);
    const c = window.__store.getState().character;
    if (c && c.pendingBabyId) window.__store.getState().nameBaby("Baby");
    window.__store.getState().clearActionResult?.();
  });
}
await page.evaluate(() => window.__store.getState().clearActionResult?.());
await page.waitForTimeout(500);
const tabs = ["Life","Activities","People","Work","Money"];
for (const t of tabs) {
  await page.getByText(t, { exact: true }).last().click();
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${SHOTS}/${which}-${t.toLowerCase()}.png` });
}
console.log("ERR", JSON.stringify(errors));
await browser.close();
