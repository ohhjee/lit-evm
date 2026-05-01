import { connect } from "puppeteer-real-browser";
import { sleep } from "./utils/sleep";
import { clickAddToWallet } from "./utils/addToWallet";

const FAUCET_URL = "https://liteforge.hub.caldera.xyz";

export async function runFaucet(walletAddress: string): Promise<boolean> {
  console.log("💧 Starting faucet...");

  const { browser } = await connect({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--start-maximized"],
    turnstile: true,
  });

  try {
    const page = (await browser.pages())[0] || (await browser.newPage());

    // ✅ Inject fake wallet BEFORE page loads
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

    await page.goto(FAUCET_URL, { waitUntil: "domcontentloaded" });

    await sleep(6000);

    // 🔌 Force wallet connection (VERY IMPORTANT)
    await page.evaluate(async () => {
      if ((window as any).ethereum) {
        await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
      }
    });

    console.log("🔌 Wallet connected");

    await clickAddToWallet(page);

    // OPTIONAL UI click (safe fallback)
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.toLowerCase().includes("add to wallet"),
      );
      if (btn) (btn as HTMLButtonElement).click();
    });

    // 🧠 Force-fill faucet input (React-safe)
    await page.evaluate((address) => {
      const input = Array.from(document.querySelectorAll("input")).find((el) =>
        el.closest("div")?.textContent?.toLowerCase().includes("faucet"),
      ) as HTMLInputElement;

      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;

        nativeSetter?.call(input, address);

        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));

        console.log("✅ Faucet input filled");
      } else {
        console.log("❌ Faucet input not found");
      }
    }, walletAddress);

    console.log("⏳ Waiting for captcha + button...");

    await page.waitForFunction(
      () => {
        const btn = Array.from(document.querySelectorAll("button")).find((b) =>
          b.textContent?.toLowerCase().includes("request"),
        ) as HTMLButtonElement;

        return btn && !btn.disabled;
      },
      { timeout: 180000 },
    );

    console.log("✅ Button enabled");

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.toLowerCase().includes("request"),
      );
      if (btn) (btn as HTMLButtonElement).click();
    });

    console.log("🚀 Faucet requested");

    await sleep(15000);

    return true;
  } catch (err: any) {
    console.error("❌ Faucet error:", err.message);
    return false;
  }
}
