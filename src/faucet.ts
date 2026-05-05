import { connect } from "puppeteer-real-browser";
import { clickAddToWallet } from "./utils/addToWallet";

const FAUCET_URL = "https://liteforge.hub.caldera.xyz";

export async function runFaucet(walletAddress: string): Promise<boolean> {
  console.log(`💧 Starting faucet for ${walletAddress}...`);

  const { browser } = await connect({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--start-maximized"],
    turnstile: true,
  });

  try {
    const page = (await browser.pages())[0] || (await browser.newPage());

    // Inject wallet
    await page.evaluateOnNewDocument((address) => {
      (window as any).ethereum = {
        isMetaMask: true,
        selectedAddress: address,
        request: async ({ method }: { method: string }) => {
          if (method === "eth_requestAccounts") return [address];
          if (method === "eth_accounts") return [address];
          return null;
        },
      };
    }, walletAddress);

    await page.goto(FAUCET_URL, { waitUntil: "networkidle2" });
    console.log("🌐 Page loaded");

    // Connect wallet
    await page.evaluate(async () => {
      if ((window as any).ethereum) {
        await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
      }
    });

    console.log("🔌 Wallet connected");

    // Optional add-to-wallet
    try {
      await clickAddToWallet(page);
    } catch {
      console.log("⚠️ Add-to-wallet skipped");
    }

    // Wait for input
    const input = await page.waitForSelector("input", { timeout: 15000 });

    if (!input) {
      throw new Error("❌ Input not found");
    }

    // Type address (safe + human-like)
    await input.click({ clickCount: 3 });
    await input.type(walletAddress, { delay: 50 });

    console.log("✅ Address typed");

    console.log("🧠 Solve CAPTCHA manually...");

    // Wait until request button is enabled
    await page.waitForFunction(
      () => {
        const btn = Array.from(document.querySelectorAll("button")).find((b) =>
          b.textContent?.toLowerCase().includes("request"),
        ) as HTMLButtonElement | undefined;

        return btn && !btn.disabled;
      },
      { timeout: 180000 },
    );

    console.log("✅ CAPTCHA solved, claiming...");

    // Click request button safely
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.toLowerCase().includes("request"),
      ) as HTMLButtonElement | undefined;

      if (btn) {
        btn.click();
      } else {
        throw new Error("Request button not found");
      }
    });

    console.log("🚀 Faucet requested");

    // Optional: wait for UI / network response
    // await page.waitForTimeout(5000);

    await browser.close();
    return true;
  } catch (err: any) {
    console.error("❌ Faucet error:", err.message);
    await browser.close();
    return false;
  }
}
