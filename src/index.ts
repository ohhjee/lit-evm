import "dotenv/config";
import { createWallets } from "./defi/farmer";
import { unwrapZkLTC, wrapZkLTC } from "./dex/ltvmswap";
// import { wrapZkLTC } from "./wrap";
import { sleep } from "./utils/sleep";
import { unwrapZkLTCWolf, wrapZkLTCWolf } from "./dex/wolfDex";
import { unwrapZkLTCAddax, wrapZkLTCAddax } from "./dex/addax";
import { runFaucet } from "./faucet";
import { randomAmount, randomDelay } from "./utils/random";

const wallets = createWallets();

async function scheduler() {
  while (true) {
    console.log("💧 Time to claim faucet");

    try {
      // const success = await runFaucet(wallet.address);
      // await runFaucet(wallet.address);
      // await wrapZkLTCAddax("0.01");
      // await unwrapZkLTCAddax("0.01");
      const amt1 = randomAmount(0.001, 0.01);
      const amt2 = randomAmount(0.005, 0.02);
      console.log(`🔁 Wrapping ${amt1} zkLTC on WolfDex...`);
      console.log(`🔁 Wrapping ${amt2} zkLTC on WolfDex...`);

      await wrapZkLTCWolf(amt1);
      await sleep(randomDelay(3000, 9000));
      await unwrapZkLTCWolf(amt1);
      await sleep(randomDelay(3000, 9000));

      await wrapZkLTC(amt2);
      await sleep(randomDelay(3000, 9000));
      await unwrapZkLTC(amt2);
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
