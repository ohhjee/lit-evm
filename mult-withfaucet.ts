import puppeteer from "puppeteer";
import { ethers } from "ethers";
import "dotenv/config";

// ========= CONFIG =========
const FAUCET_URL = process.env.FAUCET_URL!;
const PRIVATE_KEYS = process.env.PRIVATE_KEYS!.split(",");

// selectors (⚠️ YOU MUST UPDATE THESE)
const WALLET_INPUT_SELECTOR = "#wallet";
const SUBMIT_BUTTON_SELECTOR = "#submit";
const SUCCESS_SELECTOR = ".success"; // element that appears after claim

// ========= UTILS =========
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getWallets() {
  return PRIVATE_KEYS.map((pk) => new ethers.Wallet(pk));
}

function msUntilNextMidnight() {
  const now = new Date();
  const next = new Date();
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

// ========= FAUCET FLOW =========
async function claimForWallet(
  page: puppeteer.Page,
  address: string,
  index: number,
) {
  console.log(`\n💧 Wallet #${index}: ${address}`);

  await page.goto(FAUCET_URL, { waitUntil: "networkidle2" });

  // fill wallet
  await page.waitForSelector(WALLET_INPUT_SELECTOR);
  await page.click(WALLET_INPUT_SELECTOR, { clickCount: 3 });
  await page.type(WALLET_INPUT_SELECTOR, address, { delay: 50 });

  console.log("🧠 Solve CAPTCHA then press ENTER here...");

  // wait for user confirmation in terminal
  await new Promise<void>((resolve) => {
    process.stdin.once("data", () => resolve());
  });

  // click submit
  await page.click(SUBMIT_BUTTON_SELECTOR);

  try {
    await page.waitForSelector(SUCCESS_SELECTOR, { timeout: 15000 });
    console.log("✅ Claim success");
  } catch {
    console.log("⚠️ Maybe failed / rate limited");
  }

  await sleep(3000);
}

// ========= MAIN LOOP =========
async function runCycle() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();
  const wallets = getWallets();

  for (let i = 0; i < wallets.length; i++) {
    await claimForWallet(page, wallets[i].address, i + 1);
  }

  await browser.close();
}

// ========= SCHEDULER =========
async function startScheduler() {
  console.log("⏳ Waiting until 12:00 AM to start...");
  await sleep(msUntilNextMidnight());

  while (true) {
    console.log("\n🔥 Starting faucet cycle...");
    await runCycle();

    console.log("⏳ Sleeping 2 hours...\n");
    await sleep(2 * 60 * 60 * 1000);
  }
}

// ========= START =========
startScheduler();
