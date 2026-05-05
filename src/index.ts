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

function now() {
  return new Date().toLocaleTimeString();
}

let cycle = 0;
async function scheduler() {
  while (true) {
    cycle++;
    console.log(`\n💧 [${now()}] New Cycle Started (Cycle #${cycle})`);

    try {
      const amt1 = randomAmount(0.001, 0.01);
      const amt2 = randomAmount(0.003, 0.03);
      const amt3 = randomAmount(0.006, 0.05);

      console.log(`\n🪙 [${now()}] WolfDex Amount: ${amt1}`);
      console.log(`🪙 [${now()}] LTVM Amount: ${amt2}`);
      console.log(`🪙 [${now()}] Addax Amount: ${amt3}`);

      // WOLF WRAP
      console.log(`🔁 [${now()}] Wrapping ${amt1} zkLTC on WolfDex...`);
      await wrapZkLTCWolf(amt1);

      let delay = randomDelay(3000, 9000);
      console.log(`⏱ Waiting ${delay / 1000}s...\n`);
      await sleep(delay);

      // WOLF UNWRAP
      console.log(`🔁 [${now()}] Unwrapping ${amt1} zkLTC on WolfDex...`);
      await unwrapZkLTCWolf(amt1);

      console.log(`⏱ Waiting ${delay / 1000}s...\n`);
      await sleep(delay);

      // LTVM WRAP
      console.log(`🔁 [${now()}] Wrapping ${amt2} zkLTC on LTVM...`);
      await wrapZkLTC(amt2);

      console.log(`⏱ Waiting ${delay / 1000}s...\n`);
      await sleep(delay);

      // LTVM UNWRAP
      console.log(`🔁 [${now()}] Unwrapping ${amt2} zkLTC on LTVM...`);
      await unwrapZkLTC(amt2);
    } catch (err) {
      console.log(`❌ [${now()}] Error:`, err);
    }

    const waitTime = 2 * 60 * 60 * 1000;
    console.log(`⏳ [${now()}] Waiting ${waitTime / 1000 / 60} minutes...\n`);

    // await sleep(waitTime);
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
