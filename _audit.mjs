import { chromium } from "playwright";
const SHOTS = "/tmp/claude-0/-home-user-ClaudeCodeTest/b6c83874-1574-58d8-b675-af3d3ba8fa69/scratchpad/shots";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:8081", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.evaluate(() => window.__store.setState({ screen: "start", character: null }));
await page.waitForTimeout(300);
await page.getByPlaceholder(/First name/i).fill("Jordan");
await page.getByPlaceholder(/Last name/i).fill("Ellis");
await page.getByRole("button", { name: /Begin Life/i }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${SHOTS}/audit-00-birth.png` });
// play 32 years, always taking the first choice
for (let i = 0; i < 32; i++) {
  await page.evaluate(() => {
    const s = window.__store.getState();
    if (!s.character?.alive) return;
    s.ageUp();
    let g = 0;
    while (window.__store.getState().pendingEvent && g++ < 6) window.__store.getState().chooseEventOption(0);
    window.__store.getState().clearActionResult?.();
    const c = window.__store.getState().character;
    if (c && c.pendingBabyId) window.__store.getState().nameBaby("Baby");
  });
}
await page.evaluate(() => window.__store.getState().clearActionResult?.());
await page.waitForTimeout(500);
const info = await page.evaluate(() => { const c = window.__store.getState().character; return { age: c?.age, alive: c?.alive, log: c?.fullLog.length, rels: c?.relationships.length, screen: window.__store.getState().screen }; });
console.log(JSON.stringify(info));
const tabs = ["Life","Activities","School","People","Career","Money","Crime"];
for (const t of tabs) {
  await page.getByText(t, { exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/audit-${t.toLowerCase()}.png` });
}
console.log("ERR", JSON.stringify(errors));
await browser.close();
