import { runFaucet } from "./faucet";
import { sleep } from "./utils/sleep";

const wallets = ["0xYourWallet1", "0xYourWallet2", "0xYourWallet3"];

export async function runMultiWallet() {
  while (true) {
    for (const wallet of wallets) {
      console.log(`\n🚀 Running faucet for ${wallet}`);
      await runFaucet(wallet);

      await sleep(30000); // delay between wallets
    }

    console.log("\n🔁 Cycle complete. Waiting...\n");
    await sleep(120000); // cooldown between rounds
  }
}
