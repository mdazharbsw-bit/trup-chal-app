import { chromium } from "playwright";

async function runTest() {
  console.log("[Test] Launching two separate browser contexts for Host & Friend...");
  const browser = await chromium.launch({ headless: true });

  const hostContext = await browser.newContext();
  const friendContext = await browser.newContext();

  const hostPage = await hostContext.newPage();
  const friendPage = await friendContext.newPage();

  const roomCode = "MATCH1";
  console.log(`[Test] Host opening online page for room: ${roomCode}...`);

  // Host joins room as creator
  await hostPage.goto(`http://127.0.0.1:8080/play/${roomCode}?host=1`);
  await hostPage.waitForTimeout(2000);

  console.log(`[Test] Friend opening online page for room: ${roomCode}...`);
  // Friend joins same room code
  await friendPage.goto(`http://127.0.0.1:8080/play/${roomCode}`);

  // Wait 4 seconds for PeerJS WebRTC connection & lobby sync
  await friendPage.waitForTimeout(4000);

  // Host fills 2 remaining seats with bots so table has 4 players (Host, Friend, Bot1, Bot2)
  console.log("[Test] Host filling remaining 2 seats with bots...");
  const fillBotBtn = hostPage.locator("button:has-text('Fill a seat with a bot')");
  if (await fillBotBtn.isVisible()) {
    await fillBotBtn.click();
    await hostPage.waitForTimeout(1000);
    if (await fillBotBtn.isVisible()) {
      await fillBotBtn.click();
      await hostPage.waitForTimeout(1000);
    }
  }

  console.log("[Test] Host clicking Deal button...");
  const dealBtn = hostPage.locator("button:has-text('Deal')");
  if (await dealBtn.isVisible()) {
    await dealBtn.click();
    await hostPage.waitForTimeout(4000);
  }

  // Take gameplay screenshots after match start
  await hostPage.screenshot({ path: "C:/Users/mdazh/Downloads/MYTRUP/screenshots/host-gameplay.png" });
  await friendPage.screenshot({ path: "C:/Users/mdazh/Downloads/MYTRUP/screenshots/friend-gameplay.png" });
  console.log("[Test] Gameplay screenshots saved.");

  await browser.close();
  console.log("[Test] PeerJS match deal testing finished!");
}

runTest().catch((err) => {
  console.error("[Test] Error during test:", err);
  process.exit(1);
});
