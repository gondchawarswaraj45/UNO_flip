const { chromium } = require('C:/Users/Swaraj/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../docs/images');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching browser with Chrome channel...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // 2x Retina resolution
  });

  const page = await context.newPage();

  // 1. Landing Screen
  console.log('1. Capturing Landing Screen...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, '01-landing-hub.png') });

  // 2. Rules Modal (Modes Tab)
  console.log('2. Capturing Rules Modal (Modes)...');
  await page.evaluate(() => {
    if (window.__useGameStore) window.__useGameStore.setState({ showRulesModal: true });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT_DIR, '06-official-rules.png') });

  // 2B. Rules Modal (Action Cards Tab)
  console.log('2B. Capturing Rules Modal (Action Cards)...');
  const actionTabBtn = page.getByRole('button', { name: /Action Cards/i });
  if (await actionTabBtn.count() > 0) {
    await actionTabBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT_DIR, '07-action-cards-guide.png') });
  }
  await page.evaluate(() => {
    if (window.__useGameStore) window.__useGameStore.setState({ showRulesModal: false });
  });
  await page.waitForTimeout(500);

  // 3. Leaderboard Modal
  console.log('3. Capturing Leaderboard Modal...');
  await page.evaluate(() => {
    if (window.__useGameStore) window.__useGameStore.setState({ showLeaderboard: true });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT_DIR, '08-leaderboard.png') });
  await page.evaluate(() => {
    if (window.__useGameStore) window.__useGameStore.setState({ showLeaderboard: false });
  });
  await page.waitForTimeout(500);

  // 4. Mode Setup (Play with Computers)
  console.log('4. Capturing Mode Setup...');
  const computerCard = page.locator('.mode-card:has-text("Play with Computers")');
  await computerCard.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, '02-mode-setup.png') });

  // 5. Lobby Screen (Private Room)
  console.log('5. Capturing Lobby Screen...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const friendsCard = page.locator('.mode-card:has-text("Friends Online")');
  await friendsCard.click();
  await page.waitForTimeout(600);
  const createRoomBtn = page.getByRole('button', { name: /Create Room/i });
  await createRoomBtn.click();
  await page.waitForTimeout(2000);
  
  const addBotBtn = page.getByRole('button', { name: /Add Bot/i }).first();
  if (await addBotBtn.count() > 0) {
    await addBotBtn.click();
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: path.join(OUT_DIR, '03-lobby-room.png') });

  // 6. Active Gameplay (Light Side)
  console.log('6. Capturing Active Gameplay (Light Side)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const compCard2 = page.locator('.mode-card:has-text("Play with Computers")');
  await compCard2.click();
  await page.waitForTimeout(600);

  const launchBtn = page.getByRole('button', { name: /Launch Computer Match/i });
  await launchBtn.click();
  console.log('Waiting for match initialization & deal animation (4.5s)...');
  await page.waitForTimeout(4500);
  await page.screenshot({ path: path.join(OUT_DIR, '04-gameplay-light.png') });

  // 7. Active Gameplay (Dark Side)
  console.log('7. Capturing Active Gameplay (Dark Side)...');
  await page.evaluate(() => {
    if (window.__useGameStore) {
      const store = window.__useGameStore.getState();
      if (store.gameState) {
        const flippedState = {
          ...store.gameState,
          activeSide: 'DARK',
          topCard: {
            ...store.gameState.topCard,
            darkSide: {
              type: 'DRAW_FIVE',
              color: 'PINK',
              id: 'top_dark_demo'
            }
          }
        };
        window.__useGameStore.setState({ gameState: flippedState });
      }
    }
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT_DIR, '05-gameplay-dark.png') });

  // 8. Match Results & Victory Screen
  console.log('8. Capturing Match Results Screen...');
  await page.evaluate(() => {
    if (window.__useGameStore) {
      window.__useGameStore.setState({
        screen: 'RESULT',
        myPlayerId: 'p1',
        gameResult: {
          winner: 'p1',
          standings: [
            { id: 'p1', name: 'Player (You)', rank: 1, cardCount: 0, score: 320, xpGained: 180, coinsGained: 300 },
            { id: 'bot1', name: 'Maya (Bot)', rank: 2, cardCount: 2, score: 75, xpGained: 50, coinsGained: 60 },
            { id: 'bot2', name: 'Alex (Bot)', rank: 3, cardCount: 4, score: 40, xpGained: 30, coinsGained: 30 },
            { id: 'bot3', name: 'Sam (Bot)', rank: 4, cardCount: 6, score: 15, xpGained: 15, coinsGained: 15 },
          ]
        },
        gameState: {
          roomId: 'X9K2LQ',
          gameMode: 'TWO_SIDE',
          colorMode: 'FOUR',
          players: [
            { id: 'p1', name: 'Player (You)' },
            { id: 'bot1', name: 'Maya (Bot)' },
            { id: 'bot2', name: 'Alex (Bot)' },
            { id: 'bot3', name: 'Sam (Bot)' },
          ]
        }
      });
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '09-victory-result.png') });

  await browser.close();
  console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY in 2x Retina resolution!');
}

run().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
