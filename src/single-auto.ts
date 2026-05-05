import { runFaucet } from "./faucet";
import { sleep } from "./utils/sleep";

export async function autoFaucet(wallet: string) {
  while (true) {
    console.log("=================================");
    const success = await runFaucet(wallet);

    if (success) {
      console.log("✅ Claim successful");
    } else {
      console.log("❌ Claim failed");
    }

    console.log("⏳ Waiting before next claim...\n");

    await sleep(60_000); // adjust to faucet cooldown
  }
}
