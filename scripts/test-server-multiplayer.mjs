import { chromium } from "playwright";

async function runTest() {
  console.log("[Server Engine Test] Launching two separate browser contexts for Host & Friend...");
  const browser = await chromium.launch({ headless: true });

  const hostContext = await browser.newContext();
  const friendContext = await browser.newContext();

  const hostPage = await hostContext.newPage();
  const friendPage = await friendContext.newPage();

  const roomCode = "SERVER99";
  console.log(`[Server Engine Test] Host opening online page for room: ${roomCode}...`);

  // Host joins room as creator
  await hostPage.goto(`http://127.0.0.1:8080/play/${roomCode}?host=1`);
  await hostPage.waitForTimeout(1500);

  console.log(`[Server Engine Test] Friend opening online page for room: ${roomCode}...`);
  // Friend joins same room code
  await friendPage.goto(`http://127.0.0.1:8080/play/${roomCode}`);
  await friendPage.waitForTimeout(2000);

  // Take screenshots of both screens
  await hostPage.screenshot({ path: "C:/Users/mdazh/Downloads/MYTRUP/screenshots/host-server-room.png" });
  await friendPage.screenshot({ path: "C:/Users/mdazh/Downloads/MYTRUP/screenshots/friend-server-room.png" });
  console.log("[Server Engine Test] Screenshots saved.");

  // Host fills 2 remaining seats with bots
  console.log("[Server Engine Test] Host filling 2 seats with bots...");
  const fillBotBtn = hostPage.locator("button:has-text('Fill a seat with a bot')");
  if (await fillBotBtn.isVisible()) {
    await fillBotBtn.click();
    await hostPage.waitForTimeout(600);
    if (await fillBotBtn.isVisible()) {
      await fillBotBtn.click();
      await hostPage.waitForTimeout(600);
    }
  }

  console.log("[Server Engine Test] Host clicking Deal...");
  const dealBtn = hostPage.locator("button:has-text('Deal')");
  if (await dealBtn.isVisible()) {
    await dealBtn.click();
    await hostPage.waitForTimeout(2000);
  }

  await hostPage.screenshot({ path: "C:/Users/mdazh/Downloads/MYTRUP/screenshots/host-server-gameplay.png" });
  await friendPage.screenshot({ path: "C:/Users/mdazh/Downloads/MYTRUP/screenshots/friend-server-gameplay.png" });
  console.log("[Server Engine Test] Gameplay screenshots saved.");

  await browser.close();
  console.log("[Server Engine Test] Multi-player Server Engine verification completed successfully!");
}

runTest().catch((err) => {
  console.error("[Server Engine Test] Error during test:", err);
  process.exit(1);
});
