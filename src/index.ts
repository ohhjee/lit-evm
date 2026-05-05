import "dotenv/config";
import { createWallets } from "./defi/farmer";
import { unwrapZkLTC, wrapZkLTC } from "./dex/ltvmswap";
// import { wrapZkLTC } from "./wrap";
import { sleep } from "./utils/sleep";
import { unwrapZkLTCWolf, wrapZkLTCWolf } from "./dex/wolfDex";
import { unwrapZkLTCAddax, wrapZkLTCAddax } from "./dex/addax";
import { runFaucet } from "./faucet";

const wallets = createWallets();

async function scheduler() {
  while (true) {
    console.log("💧 Time to claim faucet");

    try {
      // const success = await runFaucet(wallet.address);
      // await runFaucet(wallet.address);
      // await wrapZkLTCAddax("0.01");
      // await unwrapZkLTCAddax("0.01");
      await wrapZkLTCWolf("0.001");
      await sleep(5000);
      await unwrapZkLTCWolf("0.001");
      await sleep(5000);
      await wrapZkLTC("0.001");
      await sleep(5000);
      await unwrapZkLTC("0.001");
      // await autoFaucet(wallet.address);
      // const success = await runFaucet();
      // if (success) {
      //   console.log("🌾 Starting farming...");
      //   await farm(wallet);
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
  console.log(
    "Wallets:",
    wallets.map((w) => w.address),
  );

  scheduler();
}

main();
