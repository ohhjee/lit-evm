import "dotenv/config";
import { createWallet, farm } from "./farmer";
import { runFaucet } from "./faucet";
import { sleep } from "./utils/sleep";

const wallet = createWallet();

async function scheduler() {
  while (true) {
    console.log("💧 Time to claim faucet");

    try {
      // const success = await runFaucet(wallet.address);
      // const success = await runFaucet();

      // if (success) {
      // console.log("🌾 Starting farming...");
      await farm(wallet);
      // } else {
      //   console.log("⚠️ Faucet failed, skipping farm...");
      // }
    } catch (err) {
      console.log("❌ Error:", err);
    }

    console.log("⏳ Waiting 2 hours...");
    // await sleep(2 * 60 * 60 * 1000);
  }
}

async function main() {
  console.log("🚀 FULL BOT STARTED");
  console.log("Wallet:", wallet.address);

  scheduler();
}

main();
